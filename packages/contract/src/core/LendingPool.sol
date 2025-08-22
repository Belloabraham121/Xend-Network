// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/ILendingPool.sol";
import "../interfaces/IDataTypes.sol";
import "../interfaces/IChainlinkPriceOracle.sol";
import "../interfaces/IRewardAssetFactory.sol";
import "../tokens/RWAToken.sol";

/**
 * @title LendingPool
 * @notice Manages lending and borrowing of RWA tokens with collateralization
 */
contract LendingPool is ILendingPool, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Math for uint256;
    
    // State variables
    mapping(address => mapping(address => IDataTypes.LendingPosition)) public lendingPositions;
    mapping(address => mapping(address => IDataTypes.BorrowingPosition)) public borrowingPositions;
    mapping(address => uint256) public totalDeposits;
    mapping(address => uint256) public totalBorrows;
    mapping(address => uint256) public reserveFunds;
    mapping(address => bool) public supportedAssets;
    
    // Interest rate parameters
    mapping(address => uint256) public baseInterestRates; // Annual base rate in basis points
    mapping(address => uint256) public utilizationRateThresholds; // Utilization threshold in basis points
    mapping(address => uint256) public slopeRates; // Rate increase per utilization point
    
    // Risk parameters
    mapping(address => uint256) public collateralFactors; // Collateral factor in basis points
    mapping(address => uint256) public liquidationThresholds; // Liquidation threshold in basis points
    mapping(address => uint256) public liquidationPenalties; // Liquidation penalty in basis points
    
    // Contract references
    IChainlinkPriceOracle public immutable priceOracle;
    IRewardAssetFactory public immutable assetFactory;
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MIN_HEALTH_FACTOR = 1e18; // 1.0 in 18 decimals
    uint256 public constant DEFAULT_COLLATERAL_FACTOR = 7500; // 75%
    uint256 public constant DEFAULT_LIQUIDATION_THRESHOLD = 8500; // 85%
    uint256 public constant DEFAULT_LIQUIDATION_PENALTY = 500; // 5%
    uint256 public constant DEFAULT_BASE_RATE = 200; // 2% annual
    uint256 public constant DEFAULT_UTILIZATION_THRESHOLD = 8000; // 80%
    uint256 public constant DEFAULT_SLOPE_RATE = 1000; // 10% increase per 100% utilization
    
    // Protocol settings
    uint256 public reserveFactor = 1000; // 10% of interest goes to reserves
    uint256 public minBorrowAmount = 0.01 ether;
    uint256 public minDepositAmount = 0.001 ether;
    
    // Events
    event AssetAdded(address indexed asset, uint256 collateralFactor, uint256 baseRate);
    event AssetRemoved(address indexed asset);
    event CollateralFactorUpdated(address indexed asset, uint256 oldFactor, uint256 newFactor);
    event LiquidationThresholdUpdated(address indexed asset, uint256 oldThreshold, uint256 newThreshold);
    event ReserveFactorUpdated(uint256 oldFactor, uint256 newFactor);
    event MinAmountsUpdated(uint256 minBorrow, uint256 minDeposit);
    event Deposited(address indexed user, address indexed asset, uint256 amount);
    event Withdrawn(address indexed user, address indexed asset, uint256 amount);
    event Borrowed(address indexed user, address indexed asset, uint256 amount);
    event Repaid(address indexed user, address indexed asset, uint256 amount);
    event Liquidated(address indexed borrower, address indexed liquidator, address indexed borrowAsset, address collateralAsset, uint256 repayAmount, uint256 collateralAmount);
    
    modifier supportedAsset(address asset) {
        require(supportedAssets[asset], "Asset not supported");
        _;
    }
    
    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than 0");
        _;
    }
    
    constructor(
        address _priceOracle,
        address _assetFactory,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_priceOracle != address(0), "Invalid price oracle");
        require(_assetFactory != address(0), "Invalid asset factory");
        
        priceOracle = IChainlinkPriceOracle(_priceOracle);
        assetFactory = IRewardAssetFactory(_assetFactory);
    }
    
    /**
     * @notice Deposit assets to earn interest
     * @param asset Asset address
     * @param amount Amount to deposit
     */
    function deposit(
        address asset,
        uint256 amount
    ) external override nonReentrant whenNotPaused supportedAsset(asset) validAmount(amount) {
        require(amount >= minDepositAmount, "Amount below minimum");
        
        address user = msg.sender;
        
        // Update interest before modifying position
        _updateInterest(asset);
        
        // Transfer tokens from user
        IERC20(asset).safeTransferFrom(user, address(this), amount);
        
        // Update user position
        IDataTypes.LendingPosition storage position = lendingPositions[user][asset];
        position.amount += amount;
        position.startTime = block.timestamp;
        
        // Update total deposits
        totalDeposits[asset] += amount;
        
        emit Deposited(user, asset, amount);
    }
    
    /**
     * @notice Withdraw deposited assets
     * @param asset Asset address
     * @param amount Amount to withdraw
     */
    function withdraw(
        address asset,
        uint256 amount
    ) external override nonReentrant whenNotPaused supportedAsset(asset) validAmount(amount) {
        address user = msg.sender;
        
        // Update interest before modifying position
        _updateInterest(asset);
        
        IDataTypes.LendingPosition storage position = lendingPositions[user][asset];
        require(position.amount >= amount, "Insufficient balance");
        
        // Check if withdrawal would affect borrowing capacity
        if (_getUserTotalBorrowValue(user) > 0) {
            uint256 newCollateralValue = _getUserCollateralValue(user) - _getAssetValue(asset, amount);
            uint256 borrowValue = _getUserTotalBorrowValue(user);
            require(
                _calculateHealthFactor(newCollateralValue, borrowValue) >= MIN_HEALTH_FACTOR,
                "Withdrawal would cause liquidation"
            );
        }
        
        // Update user position
        position.amount -= amount;
        position.startTime = block.timestamp;
        
        // Update total deposits
        totalDeposits[asset] -= amount;
        
        // Transfer tokens to user
        IERC20(asset).safeTransfer(user, amount);
        
        emit Withdrawn(user, asset, amount);
    }
    
    /**
     * @notice Borrow assets against collateral (interface implementation)
     * @param asset Asset address to borrow
     * @param amount Amount to borrow
     * @param collateral Collateral asset address
     * @param collateralAmount Collateral amount
     */
    function borrow(
        address asset,
        uint256 amount,
        address collateral,
        uint256 collateralAmount
    ) external override nonReentrant whenNotPaused supportedAsset(asset) supportedAsset(collateral) validAmount(amount) {
        require(collateralAmount > 0, "Collateral amount must be greater than 0");
        
        address user = msg.sender;
        
        // Update interest before modifying position
        _updateInterest(asset);
        _updateInterest(collateral);
        
        // Check available liquidity
        uint256 availableLiquidity = _getAvailableLiquidity(asset);
        require(amount <= availableLiquidity, "Insufficient liquidity");
        
        // Transfer collateral from user
        IERC20(collateral).safeTransferFrom(user, address(this), collateralAmount);
        
        // Check collateral ratio
        uint256 collateralValue = _getAssetValue(collateral, collateralAmount);
        uint256 borrowValue = _getAssetValue(asset, amount);
        uint256 requiredCollateral = (borrowValue * BASIS_POINTS) / collateralFactors[collateral];
        
        require(collateralValue >= requiredCollateral, "Insufficient collateral");
        
        // Update user position
        IDataTypes.BorrowingPosition storage position = borrowingPositions[user][asset];
        position.amount += amount;
        position.startTime = block.timestamp;
        
        // Update total borrows
        totalBorrows[asset] += amount;
        
        // Transfer borrowed assets to user
        IERC20(asset).safeTransfer(user, amount);
        
        emit Borrow(user, asset, amount, collateral, collateralAmount);
    }
    
    /**
     * @notice Borrow assets against collateral (internal)
     * @param asset Asset address
     * @param amount Amount to borrow
     */
    function borrow(
        address asset,
        uint256 amount
    ) external nonReentrant whenNotPaused supportedAsset(asset) validAmount(amount) {
        require(amount >= minBorrowAmount, "Amount below minimum");
        
        address user = msg.sender;
        
        // Update interest before modifying position
        _updateInterest(asset);
        
        // Check available liquidity
        uint256 availableLiquidity = _getAvailableLiquidity(asset);
        require(amount <= availableLiquidity, "Insufficient liquidity");
        
        // Check borrowing capacity
        uint256 collateralValue = _getUserCollateralValue(user);
        uint256 currentBorrowValue = _getUserTotalBorrowValue(user);
        uint256 newBorrowValue = currentBorrowValue + _getAssetValue(asset, amount);
        
        require(
            _calculateHealthFactor(collateralValue, newBorrowValue) >= MIN_HEALTH_FACTOR,
            "Insufficient collateral"
        );
        
        // Update user position
        IDataTypes.BorrowingPosition storage position = borrowingPositions[user][asset];
        position.amount += amount;
        position.startTime = block.timestamp;
        
        // Update total borrows
        totalBorrows[asset] += amount;
        
        // Transfer tokens to user
        IERC20(asset).safeTransfer(user, amount);
        
        emit Borrowed(user, asset, amount);
    }
    
    /**
     * @notice Repay borrowed assets
     * @param asset Asset address
     * @param amount Amount to repay
     */
    function repay(
        address asset,
        uint256 amount
    ) external override nonReentrant whenNotPaused supportedAsset(asset) validAmount(amount) {
        address user = msg.sender;
        
        // Update interest before modifying position
        _updateInterest(asset);
        
        IDataTypes.BorrowingPosition storage position = borrowingPositions[user][asset];
        require(position.amount > 0, "No debt to repay");
        
        // Calculate actual repay amount (can't repay more than owed)
        uint256 actualAmount = Math.min(amount, position.amount);
        
        // Transfer tokens from user
        IERC20(asset).safeTransferFrom(user, address(this), actualAmount);
        
        // Update user position
        position.amount -= actualAmount;
        position.startTime = block.timestamp;
        
        // Update total borrows
        totalBorrows[asset] -= actualAmount;
        
        emit Repaid(user, asset, actualAmount);
    }
    
    /**
     * @notice Liquidate an undercollateralized position (interface implementation)
     * @param borrower Borrower address
     * @param asset Asset being borrowed
     */
    function liquidate(
        address borrower,
        address asset
    ) external override nonReentrant whenNotPaused supportedAsset(asset) {
        require(borrower != msg.sender, "Cannot liquidate self");
        
        // Update interest
        _updateInterest(asset);
        
        // Check if position is liquidatable
        uint256 collateralValue = _getUserCollateralValue(borrower);
        uint256 borrowValue = _getUserTotalBorrowValue(borrower);
        uint256 healthFactor = _calculateHealthFactor(collateralValue, borrowValue);
        
        require(healthFactor < MIN_HEALTH_FACTOR, "Position not liquidatable");
        
        // Simple liquidation - for interface compliance
        IDataTypes.BorrowingPosition storage position = borrowingPositions[borrower][asset];
        require(position.amount > 0, "No debt to liquidate");
        
        // For simplicity, liquidate 50% of debt
        uint256 liquidationAmount = position.amount / 2;
        
        // Update position
        position.amount -= liquidationAmount;
        totalBorrows[asset] -= liquidationAmount;
    }
    
    /**
     * @notice Liquidate an undercollateralized position (full implementation)
     * @param borrower Borrower address
     * @param borrowAsset Asset being borrowed
     * @param collateralAsset Collateral asset to seize
     * @param repayAmount Amount to repay
     */
    function liquidate(
        address borrower,
        address borrowAsset,
        address collateralAsset,
        uint256 repayAmount
    ) external nonReentrant whenNotPaused supportedAsset(borrowAsset) supportedAsset(collateralAsset) {
        require(borrower != msg.sender, "Cannot liquidate self");
        
        // Update interest for both assets
        _updateInterest(borrowAsset);
        _updateInterest(collateralAsset);
        
        // Check if position is liquidatable
        uint256 collateralValue = _getUserCollateralValue(borrower);
        uint256 borrowValue = _getUserTotalBorrowValue(borrower);
        uint256 healthFactor = _calculateHealthFactor(collateralValue, borrowValue);
        
        require(healthFactor < MIN_HEALTH_FACTOR, "Position not liquidatable");
        
        // Calculate liquidation amounts
        IDataTypes.BorrowingPosition storage borrowPosition = borrowingPositions[borrower][borrowAsset];
        require(borrowPosition.amount > 0, "No debt to liquidate");
        
        uint256 maxRepayAmount = (borrowPosition.amount * 5000) / BASIS_POINTS; // Max 50% of debt
        uint256 actualRepayAmount = Math.min(repayAmount, maxRepayAmount);
        
        // Calculate collateral to seize
        uint256 repayValue = _getAssetValue(borrowAsset, actualRepayAmount);
        uint256 liquidationPenalty = liquidationPenalties[collateralAsset];
        uint256 collateralValueToSeize = (repayValue * (BASIS_POINTS + liquidationPenalty)) / BASIS_POINTS;
        uint256 collateralAmount = _getAssetAmount(collateralAsset, collateralValueToSeize);
        
        IDataTypes.LendingPosition storage collateralPosition = lendingPositions[borrower][collateralAsset];
        require(collateralPosition.amount >= collateralAmount, "Insufficient collateral");
        
        // Transfer repay amount from liquidator
        IERC20(borrowAsset).safeTransferFrom(msg.sender, address(this), actualRepayAmount);
        
        // Update borrower positions
        borrowPosition.amount -= actualRepayAmount;
        collateralPosition.amount -= collateralAmount;
        
        // Update totals
        totalBorrows[borrowAsset] -= actualRepayAmount;
        totalDeposits[collateralAsset] -= collateralAmount;
        
        // Transfer collateral to liquidator
        IERC20(collateralAsset).safeTransfer(msg.sender, collateralAmount);
        
        emit Liquidated(borrower, msg.sender, borrowAsset, collateralAsset, actualRepayAmount, collateralAmount);
    }
    
    /**
     * @notice Get user's lending position
     * @param user User address
     * @param asset Asset address
     * @return Lending position
     */
    function getLendingPosition(
        address user,
        address asset
    ) external view override returns (IDataTypes.LendingPosition memory) {
        return lendingPositions[user][asset];
    }
    
    /**
     * @notice Get user's borrowing position
     * @param user User address
     * @param asset Asset address
     * @return Borrowing position
     */
    function getBorrowingPosition(
        address user,
        address asset
    ) external view override returns (IDataTypes.BorrowingPosition memory) {
        return borrowingPositions[user][asset];
    }
    
    /**
     * @notice Calculate current interest rate for an asset
     * @param asset Asset address
     * @return Current interest rate in basis points
     */
    function calculateInterestRate(address asset) public view supportedAsset(asset) returns (uint256) {
        if (totalDeposits[asset] == 0) return baseInterestRates[asset];
        
        uint256 utilizationRate = (totalBorrows[asset] * BASIS_POINTS) / totalDeposits[asset];
        uint256 baseRate = baseInterestRates[asset];
        uint256 threshold = utilizationRateThresholds[asset];
        
        if (utilizationRate <= threshold) {
            return baseRate;
        } else {
            uint256 excessUtilization = utilizationRate - threshold;
            uint256 slopeRate = slopeRates[asset];
            return baseRate + (excessUtilization * slopeRate) / BASIS_POINTS;
        }
    }
    
    /**
     * @notice Get user's health factor
     * @param user User address
     * @return Health factor (1e18 = 100%)
     */
    function getUserHealthFactor(address user) external view returns (uint256) {
        uint256 collateralValue = _getUserCollateralValue(user);
        uint256 borrowValue = _getUserTotalBorrowValue(user);
        
        return _calculateHealthFactor(collateralValue, borrowValue);
    }
    
    /**
     * @notice Get available liquidity for an asset
     * @param asset Asset address
     * @return Available liquidity
     */
    function getAvailableLiquidity(address asset) external view override supportedAsset(asset) returns (uint256) {
        return _getAvailableLiquidity(asset);
    }
    
    /**
     * @notice Add support for a new asset
     * @param asset Asset address
     * @param collateralFactor Collateral factor in basis points
     * @param baseRate Base interest rate in basis points
     */
    function addAsset(
        address asset,
        uint256 collateralFactor,
        uint256 baseRate
    ) external onlyOwner {
        require(!supportedAssets[asset], "Asset already supported");
        require(assetFactory.isValidAsset(asset), "Invalid asset");
        require(collateralFactor <= BASIS_POINTS, "Invalid collateral factor");
        
        supportedAssets[asset] = true;
        collateralFactors[asset] = collateralFactor;
        liquidationThresholds[asset] = DEFAULT_LIQUIDATION_THRESHOLD;
        liquidationPenalties[asset] = DEFAULT_LIQUIDATION_PENALTY;
        baseInterestRates[asset] = baseRate;
        utilizationRateThresholds[asset] = DEFAULT_UTILIZATION_THRESHOLD;
        slopeRates[asset] = DEFAULT_SLOPE_RATE;
        
        emit AssetAdded(asset, collateralFactor, baseRate);
    }
    
    /**
     * @notice Remove support for an asset
     * @param asset Asset address
     */
    function removeAsset(address asset) external onlyOwner supportedAsset(asset) {
        require(totalDeposits[asset] == 0 && totalBorrows[asset] == 0, "Asset has active positions");
        
        supportedAssets[asset] = false;
        
        emit AssetRemoved(asset);
    }
    
    /**
     * @notice Update collateral factor for an asset
     * @param asset Asset address
     * @param newFactor New collateral factor
     */
    function setCollateralFactor(address asset, uint256 newFactor) external onlyOwner supportedAsset(asset) {
        require(newFactor <= BASIS_POINTS, "Invalid collateral factor");
        
        uint256 oldFactor = collateralFactors[asset];
        collateralFactors[asset] = newFactor;
        
        emit CollateralFactorUpdated(asset, oldFactor, newFactor);
    }
    
    /**
     * @notice Update liquidation threshold for an asset
     * @param asset Asset address
     * @param newThreshold New liquidation threshold
     */
    function setLiquidationThreshold(address asset, uint256 newThreshold) external onlyOwner supportedAsset(asset) {
        require(newThreshold <= BASIS_POINTS, "Invalid threshold");
        require(newThreshold > collateralFactors[asset], "Threshold must be higher than collateral factor");
        
        uint256 oldThreshold = liquidationThresholds[asset];
        liquidationThresholds[asset] = newThreshold;
        
        emit LiquidationThresholdUpdated(asset, oldThreshold, newThreshold);
    }
    
    /**
     * @notice Update reserve factor
     * @param newFactor New reserve factor
     */
    function setReserveFactor(uint256 newFactor) external onlyOwner {
        require(newFactor <= 5000, "Reserve factor too high"); // Max 50%
        
        uint256 oldFactor = reserveFactor;
        reserveFactor = newFactor;
        
        emit ReserveFactorUpdated(oldFactor, newFactor);
    }
    
    /**
     * @notice Update minimum amounts
     * @param newMinBorrow New minimum borrow amount
     * @param newMinDeposit New minimum deposit amount
     */
    function setMinAmounts(uint256 newMinBorrow, uint256 newMinDeposit) external onlyOwner {
        minBorrowAmount = newMinBorrow;
        minDepositAmount = newMinDeposit;
        
        emit MinAmountsUpdated(newMinBorrow, newMinDeposit);
    }
    
    /**
     * @notice Get current interest rate for an asset
     * @param asset Asset address
     * @return Current interest rate
     */
    function getInterestRate(address asset) external view override supportedAsset(asset) returns (uint256) {
        return calculateInterestRate(asset);
    }
    
    /**
     * @notice Set interest rate for an asset
     * @param asset Asset address
     * @param rate New interest rate
     */
    function setInterestRate(
        address asset,
        uint256 rate
    ) external override onlyOwner supportedAsset(asset) {
        require(rate <= 5000, "Interest rate too high"); // Max 50% annual
        baseInterestRates[asset] = rate;
        emit InterestRateUpdated(asset, rate);
    }
    
    /**
     * @notice Calculate interest for a given amount and duration
     * @param asset Asset address
     * @param amount Principal amount
     * @param duration Duration in seconds
     * @return Interest amount
     */
    function calculateInterest(
        address asset,
        uint256 amount,
        uint256 duration
    ) external view override supportedAsset(asset) returns (uint256) {
        uint256 rate = calculateInterestRate(asset);
        return (amount * rate * duration) / (BASIS_POINTS * SECONDS_PER_YEAR);
    }
    
    /**
     * @notice Get total borrowed amount for an asset
     * @param asset Asset address
     * @return Total borrowed amount
     */
    function getTotalBorrowed(address asset) external view override supportedAsset(asset) returns (uint256) {
        return totalBorrows[asset];
    }
    
    /**
     * @notice Get collateral ratio for a borrower's asset
     * @param borrower Borrower address
     * @param asset Asset address
     * @return Collateral ratio in basis points
     */
    function getCollateralRatio(
        address borrower,
        address asset
    ) external view override returns (uint256) {
        uint256 collateralValue = _getUserCollateralValue(borrower);
        uint256 borrowValue = _getUserTotalBorrowValue(borrower);
        
        if (borrowValue == 0) return type(uint256).max;
        
        return (collateralValue * BASIS_POINTS) / borrowValue;
    }
    
    // Internal functions
    
    function _updateInterest(address asset) internal {
        uint256 currentRate = calculateInterestRate(asset);
        emit InterestRateUpdated(asset, currentRate);
    }
    
    function _getUserCollateralValue(address user) internal view returns (uint256) {
        // This would iterate through all user's lending positions
        // For simplicity, returning 0 - should be implemented based on actual positions
        return 0;
    }
    
    function _getUserTotalBorrowValue(address user) internal view returns (uint256) {
        // This would iterate through all user's borrowing positions
        // For simplicity, returning 0 - should be implemented based on actual positions
        return 0;
    }
    
    function _getAssetValue(address asset, uint256 amount) internal view returns (uint256) {
        uint256 price = priceOracle.getPrice(asset);
        return (amount * price) / 1e18;
    }
    
    function _getAssetAmount(address asset, uint256 value) internal view returns (uint256) {
        uint256 price = priceOracle.getPrice(asset);
        return (value * 1e18) / price;
    }
    
    function _calculateHealthFactor(uint256 collateralValue, uint256 borrowValue) internal pure returns (uint256) {
        if (borrowValue == 0) return type(uint256).max;
        return (collateralValue * 1e18) / borrowValue;
    }
    
    function _getAvailableLiquidity(address asset) internal view returns (uint256) {
        return totalDeposits[asset] - totalBorrows[asset];
    }
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdrawal function
     */
    function emergencyWithdraw(address asset) external onlyOwner {
        uint256 balance = IERC20(asset).balanceOf(address(this));
        IERC20(asset).safeTransfer(owner(), balance);
    }
}