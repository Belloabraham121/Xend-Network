// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IStrategyVault.sol";
import "../interfaces/IDataTypes.sol";
import "../interfaces/IChainlinkPriceOracle.sol";
import "../interfaces/IRewardAssetFactory.sol";
import "../interfaces/IPortfolioManager.sol";

/**
 * @title StrategyVault
 * @notice Manages investment strategies for RWA tokens with automated rebalancing
 */
contract StrategyVault is IStrategyVault, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using Math for uint256;
    
    // State variables
    mapping(uint256 => IDataTypes.StrategyInfo) public strategies;
    mapping(address => mapping(uint256 => IDataTypes.StrategyPosition)) public userPositions;
    mapping(address => uint256[]) public userStrategies;
    mapping(uint256 => address[]) public strategyInvestors;
    mapping(uint256 => mapping(address => uint256)) public strategyAssetAllocations;
    mapping(uint256 => address[]) public strategyAssets;
    
    // Strategy counters and limits
    uint256 public nextStrategyId = 1;
    uint256 public maxStrategiesPerUser = 10;
    uint256 public maxAssetsPerStrategy = 20;
    uint256 public minInvestmentAmount = 0.01 ether;
    
    // Fee structure
    uint256 public managementFee = 200; // 2% annual
    uint256 public performanceFee = 2000; // 20% of profits
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    // Contract references
    IChainlinkPriceOracle public immutable priceOracle;
    IRewardAssetFactory public immutable assetFactory;
    IPortfolioManager public immutable portfolioManager;
    
    // Strategy types
    enum StrategyType {
        CONSERVATIVE,
        BALANCED,
        AGGRESSIVE,
        CUSTOM
    }
    
    // Rebalancing parameters
    uint256 public rebalanceThreshold = 500; // 5% deviation triggers rebalance
    uint256 public rebalanceInterval = 7 days;
    mapping(uint256 => uint256) public lastRebalanceTime;
    
    // Performance tracking
    mapping(uint256 => uint256) public strategyTotalValue;
    mapping(uint256 => uint256) public strategyHighWaterMark;
    mapping(uint256 => uint256) public strategyCreationTime;
    
    // Strategy shares and investment tracking
    mapping(uint256 => uint256) public strategyTotalShares;
    mapping(uint256 => uint256) public strategyTotalInvested;
    
    // Events
    event StrategyTypeUpdated(uint256 indexed strategyId, StrategyType strategyType);
    event RebalanceThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event RebalanceIntervalUpdated(uint256 oldInterval, uint256 newInterval);
    event ManagementFeeUpdated(uint256 oldFee, uint256 newFee);
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
    event MaxLimitsUpdated(uint256 maxStrategies, uint256 maxAssets, uint256 minInvestment);
    event Invested(address indexed investor, uint256 indexed strategyId, uint256 amount, uint256 shares);
    event Withdrawn(address indexed investor, uint256 indexed strategyId, uint256 shares, uint256 amount);
    event FeesCollected(uint256 indexed strategyId, uint256 managementFee, uint256 performanceFee);
    
    modifier validStrategy(uint256 strategyId) {
        require(strategyId > 0 && strategyId < nextStrategyId, "Invalid strategy ID");
        require(strategies[strategyId].isActive, "Strategy not active");
        _;
    }
    
    modifier validAmount(uint256 amount) {
        require(amount >= minInvestmentAmount, "Amount below minimum");
        _;
    }
    
    constructor(
        address _priceOracle,
        address _assetFactory,
        address _portfolioManager
    ) Ownable(msg.sender) {
        require(_priceOracle != address(0), "Invalid price oracle");
        require(_assetFactory != address(0), "Invalid asset factory");
        require(_portfolioManager != address(0), "Invalid portfolio manager");
        
        priceOracle = IChainlinkPriceOracle(_priceOracle);
        assetFactory = IRewardAssetFactory(_assetFactory);
        portfolioManager = IPortfolioManager(_portfolioManager);
    }
    
    /**
     * @notice Create a new investment strategy
     * @param name Strategy name
     * @param description Strategy description
     * @param allowedAssets Array of allowed asset addresses
     * @param minInvestment Minimum investment amount
     * @param maxInvestment Maximum investment amount
     * @param expectedReturn Expected annual return (in basis points)
     * @param riskLevel Risk level (1-10)
     * @return strategyId The ID of the created strategy
     */
    function createStrategy(
        string memory name,
        string memory description,
        address[] memory allowedAssets,
        uint256 minInvestment,
        uint256 maxInvestment,
        uint256 expectedReturn,
        uint256 riskLevel
    ) external override onlyOwner returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(allowedAssets.length > 0 && allowedAssets.length <= maxAssetsPerStrategy, "Invalid assets array");
        require(minInvestment >= minInvestmentAmount, "Min investment too low");
        require(maxInvestment >= minInvestment, "Max investment must be >= min investment");
        require(expectedReturn <= 10000, "Expected return too high"); // Max 100%
        require(riskLevel >= 1 && riskLevel <= 10, "Risk level must be 1-10");
        
        for (uint256 i = 0; i < allowedAssets.length; i++) {
            require(assetFactory.isValidAsset(allowedAssets[i]), "Invalid asset");
        }
        
        uint256 strategyId = nextStrategyId++;
        
        strategies[strategyId] = IDataTypes.StrategyInfo({
            name: name,
            description: description,
            allowedAssets: allowedAssets,
            minInvestment: minInvestment,
            maxInvestment: maxInvestment,
            expectedReturn: expectedReturn,
            riskLevel: riskLevel,
            isActive: true,
            manager: msg.sender
        });
        
        // Store allowed assets
        strategyAssets[strategyId] = allowedAssets;
        strategyCreationTime[strategyId] = block.timestamp;
        lastRebalanceTime[strategyId] = block.timestamp;
        
        emit StrategyCreated(strategyId, name, msg.sender);
        
        return strategyId;
    }
    
    /**
     * @notice Invest in a strategy
     * @param strategyId Strategy ID
     * @param amount Amount to invest (in base currency)
     */
    function invest(
        uint256 strategyId,
        uint256 amount
    ) external override nonReentrant whenNotPaused validStrategy(strategyId) validAmount(amount) {
        address investor = msg.sender;
        
        // Check user strategy limit
        if (userPositions[investor][strategyId].shares == 0) {
            require(userStrategies[investor].length < maxStrategiesPerUser, "Max strategies reached");
            userStrategies[investor].push(strategyId);
            strategyInvestors[strategyId].push(investor);
        }
        
        // Calculate shares to mint
        uint256 shares;
        if (strategyTotalShares[strategyId] == 0) {
            shares = amount; // 1:1 for first investment
        } else {
            uint256 currentValue = getStrategyValue(strategyId);
            shares = (amount * strategyTotalShares[strategyId]) / currentValue;
        }
        
        // Update strategy and user position
        strategyTotalInvested[strategyId] += amount;
        strategyTotalShares[strategyId] += shares;
        
        userPositions[investor][strategyId].shares += shares;
        userPositions[investor][strategyId].amount += amount;
        userPositions[investor][strategyId].entryTime = block.timestamp;
        
        // Transfer funds and execute investment
        _executeInvestment(strategyId, amount);
        
        emit Invested(investor, strategyId, amount, shares);
    }
    
    /**
     * @notice Withdraw from a strategy
     * @param strategyId Strategy ID
     * @param shares Number of shares to withdraw
     */
    function withdraw(
        uint256 strategyId,
        uint256 shares
    ) external override nonReentrant whenNotPaused validStrategy(strategyId) {
        address investor = msg.sender;
        
        IDataTypes.StrategyPosition storage position = userPositions[investor][strategyId];
        require(position.shares >= shares, "Insufficient shares");
        require(shares > 0, "Shares must be greater than 0");
        
        // Calculate withdrawal amount
        uint256 currentValue = getStrategyValue(strategyId);
        uint256 withdrawalAmount = (shares * currentValue) / strategyTotalShares[strategyId];
        
        // Apply management fee if applicable
        uint256 feeAmount = _calculateManagementFee(strategyId, withdrawalAmount);
        uint256 netAmount = withdrawalAmount - feeAmount;
        
        // Update positions
        position.shares -= shares;
        position.lastRebalance = block.timestamp;
        strategyTotalShares[strategyId] -= shares;
        
        // Execute withdrawal
        _executeWithdrawal(strategyId, netAmount);
        
        // Collect fees
        if (feeAmount > 0) {
            _collectFees(strategyId, feeAmount);
        }
        
        emit Withdrawn(investor, strategyId, shares, netAmount);
    }
    
    /**
     * @notice Rebalance a strategy to target allocations
     * @param strategyId Strategy ID
     */
    function rebalanceStrategy(uint256 strategyId) external override validStrategy(strategyId) {
        require(
            msg.sender == strategies[strategyId].manager || msg.sender == owner(),
            "Not authorized to rebalance"
        );
        
        require(
            block.timestamp >= lastRebalanceTime[strategyId] + rebalanceInterval,
            "Rebalance interval not reached"
        );
        
        // Check if rebalancing is needed
        bool needsRebalance = _checkRebalanceNeeded(strategyId);
        require(needsRebalance, "Rebalancing not needed");
        
        // Execute rebalancing
        _executeRebalance(strategyId);
        
        lastRebalanceTime[strategyId] = block.timestamp;
        lastRebalanceTime[strategyId] = block.timestamp;
        
        emit StrategyRebalanced(strategyId, block.timestamp);
    }
    
    /**
     * @notice Get strategy information
     * @param strategyId Strategy ID
     * @return Strategy information
     */
    function getStrategyInfo(uint256 strategyId) external view validStrategy(strategyId) returns (IDataTypes.StrategyInfo memory) {
        return strategies[strategyId];
    }
    
    /**
     * @notice Get user's position in a strategy
     * @param user User address
     * @param strategyId Strategy ID
     * @return Strategy position
     */
    function getUserPosition(
        address user,
        uint256 strategyId
    ) external view validStrategy(strategyId) returns (IDataTypes.StrategyPosition memory) {
        return userPositions[user][strategyId];
    }
    
    /**
     * @notice Get strategy's current total value
     * @param strategyId Strategy ID
     * @return Total value in base currency
     */
    function getStrategyValue(uint256 strategyId) public view validStrategy(strategyId) returns (uint256) {
        uint256 totalValue = 0;
        address[] memory assets = strategyAssets[strategyId];
        
        for (uint256 i = 0; i < assets.length; i++) {
            address asset = assets[i];
            uint256 balance = IERC20(asset).balanceOf(address(this));
            uint256 price = priceOracle.getPrice(asset);
            totalValue += (balance * price) / 1e18;
        }
        
        return totalValue;
    }
    

    
    /**
     * @notice Get user's strategies
     * @param user User address
     * @return Array of strategy IDs
     */
    function getUserStrategies(address user) external view returns (uint256[] memory) {
        return userStrategies[user];
    }
    
    /**
     * @notice Get strategy investors
     * @param strategyId Strategy ID
     * @return Array of investor addresses
     */
    function getStrategyInvestors(uint256 strategyId) external view validStrategy(strategyId) returns (address[] memory) {
        return strategyInvestors[strategyId];
    }
    
    /**
     * @notice Collect management and performance fees
     * @param strategyId Strategy ID
     */
    function collectFees(uint256 strategyId) external validStrategy(strategyId) {
        require(
            msg.sender == strategies[strategyId].manager || msg.sender == owner(),
            "Not authorized to collect fees"
        );
        
        uint256 currentValue = getStrategyValue(strategyId);
        uint256 managementFeeAmount = _calculateManagementFee(strategyId, currentValue);
        uint256 performanceFeeAmount = _calculatePerformanceFee(strategyId, currentValue);
        
        uint256 totalFees = managementFeeAmount + performanceFeeAmount;
        
        if (totalFees > 0) {
            _collectFees(strategyId, totalFees);
            emit FeesCollected(strategyId, managementFeeAmount, performanceFeeAmount);
        }
    }
    
    // Internal functions
    
    function _executeInvestment(uint256 strategyId, uint256 amount) internal {
        address[] memory assets = strategyAssets[strategyId];
        
        for (uint256 i = 0; i < assets.length; i++) {
            address asset = assets[i];
            uint256 allocation = strategyAssetAllocations[strategyId][asset];
            uint256 investAmount = (amount * allocation) / BASIS_POINTS;
            
            if (investAmount > 0) {
                // In a real implementation, this would purchase the actual assets
                // For now, we'll assume the contract holds the assets
            }
        }
    }
    
    function _executeWithdrawal(uint256 strategyId, uint256 amount) internal {
        // In a real implementation, this would sell assets proportionally
        // and transfer the proceeds to the user
        payable(msg.sender).transfer(amount);
    }
    
    function _executeRebalance(uint256 strategyId) internal {
        // Get current allocations and target allocations
        address[] memory assets = strategyAssets[strategyId];
        uint256 totalValue = getStrategyValue(strategyId);
        
        for (uint256 i = 0; i < assets.length; i++) {
            address asset = assets[i];
            uint256 currentBalance = IERC20(asset).balanceOf(address(this));
            uint256 currentValue = (currentBalance * priceOracle.getPrice(asset)) / 1e18;
            uint256 targetAllocation = strategyAssetAllocations[strategyId][asset];
            uint256 targetValue = (totalValue * targetAllocation) / BASIS_POINTS;
            
            // Rebalance if deviation exceeds threshold
            if (currentValue != targetValue) {
                // In a real implementation, this would buy/sell assets to reach target allocation
            }
        }
    }
    
    function _checkRebalanceNeeded(uint256 strategyId) internal view returns (bool) {
        address[] memory assets = strategyAssets[strategyId];
        uint256 totalValue = getStrategyValue(strategyId);
        
        if (totalValue == 0) return false;
        
        for (uint256 i = 0; i < assets.length; i++) {
            address asset = assets[i];
            uint256 currentBalance = IERC20(asset).balanceOf(address(this));
            uint256 currentValue = (currentBalance * priceOracle.getPrice(asset)) / 1e18;
            uint256 currentAllocation = (currentValue * BASIS_POINTS) / totalValue;
            uint256 targetAllocation = strategyAssetAllocations[strategyId][asset];
            
            uint256 deviation = currentAllocation > targetAllocation 
                ? currentAllocation - targetAllocation 
                : targetAllocation - currentAllocation;
                
            if (deviation > rebalanceThreshold) {
                return true;
            }
        }
        
        return false;
    }
    
    function _calculateManagementFee(uint256 strategyId, uint256 amount) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - strategyCreationTime[strategyId];
        return (amount * managementFee * timeElapsed) / (BASIS_POINTS * SECONDS_PER_YEAR);
    }
    
    function _calculatePerformanceFee(uint256 strategyId, uint256 currentValue) internal view returns (uint256) {
        uint256 highWaterMark = strategyHighWaterMark[strategyId];
        if (currentValue <= highWaterMark) {
            return 0;
        }
        
        uint256 profit = currentValue - highWaterMark;
        return (profit * performanceFee) / BASIS_POINTS;
    }
    
    function _collectFees(uint256 strategyId, uint256 feeAmount) internal {
        address manager = strategies[strategyId].manager;
        payable(manager).transfer(feeAmount);
    }
    
    /**
     * @notice Get strategy information
     * @param strategyId Strategy ID
     * @return Strategy information
     */
    function getStrategy(uint256 strategyId) 
        external 
        view 
        override
        validStrategy(strategyId)
        returns (IDataTypes.StrategyInfo memory) 
    {
        return strategies[strategyId];
    }
    
    /**
     * @notice Get all strategies
     * @return Array of all strategies
     */
    function getAllStrategies() 
        external 
        view 
        override
        returns (IDataTypes.StrategyInfo[] memory) 
    {
        IDataTypes.StrategyInfo[] memory allStrategies = new IDataTypes.StrategyInfo[](nextStrategyId - 1);
        for (uint256 i = 1; i < nextStrategyId; i++) {
            allStrategies[i - 1] = strategies[i];
        }
        return allStrategies;
    }
    
    /**
     * @notice Get active strategies
     * @return Array of active strategies
     */
    function getActiveStrategies() 
        external 
        view 
        override
        returns (IDataTypes.StrategyInfo[] memory) 
    {
        // First count active strategies
        uint256 activeCount = 0;
        for (uint256 i = 1; i < nextStrategyId; i++) {
            if (strategies[i].isActive) {
                activeCount++;
            }
        }
        
        // Create array and populate
        IDataTypes.StrategyInfo[] memory activeStrategies = new IDataTypes.StrategyInfo[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i < nextStrategyId; i++) {
            if (strategies[i].isActive) {
                activeStrategies[index] = strategies[i];
                index++;
            }
        }
        return activeStrategies;
    }
    
    /**
     * @notice Calculate shares for investment amount
     * @param strategyId Strategy ID
     * @param amount Investment amount
     * @return Number of shares
     */
    function calculateShares(
        uint256 strategyId,
        uint256 amount
    ) external 
        view 
        override
        validStrategy(strategyId)
        returns (uint256) 
    {
        if (strategyTotalShares[strategyId] == 0) {
            return amount; // 1:1 for first investment
        } else {
            uint256 currentValue = getStrategyValue(strategyId);
            return (amount * strategyTotalShares[strategyId]) / currentValue;
        }
    }
    
    /**
     * @notice Get strategy position for investor
     * @param investor Investor address
     * @param strategyId Strategy ID
     * @return Strategy position
     */
    function getStrategyPosition(
        address investor,
        uint256 strategyId
    ) external 
        view 
        override
        validStrategy(strategyId)
        returns (IDataTypes.StrategyPosition memory) 
    {
        return userPositions[investor][strategyId];
    }
    
    /**
     * @notice Get all investor positions
     * @param investor Investor address
     * @return Array of strategy positions
     */
    function getInvestorPositions(address investor) 
        external 
        view 
        override
        returns (IDataTypes.StrategyPosition[] memory) 
    {
        uint256[] memory investorStrategies = userStrategies[investor];
        IDataTypes.StrategyPosition[] memory positions = new IDataTypes.StrategyPosition[](investorStrategies.length);
        
        for (uint256 i = 0; i < investorStrategies.length; i++) {
            positions[i] = userPositions[investor][investorStrategies[i]];
        }
        
        return positions;
    }
    
    /**
     * @notice Get strategy performance metrics
     * @param strategyId Strategy ID
     * @return totalValue Current total value of the strategy
     * @return totalReturn Total return since inception
     */
    function getStrategyPerformance(uint256 strategyId) 
        external 
        view 
        override
        validStrategy(strategyId)
        returns (uint256 totalValue, uint256 totalReturn) 
    {
        totalValue = getStrategyValue(strategyId);
        uint256 totalInvested = strategyTotalInvested[strategyId];
        
        if (totalInvested > 0) {
            totalReturn = totalValue > totalInvested ? 
                ((totalValue - totalInvested) * BASIS_POINTS) / totalInvested : 0;
        } else {
            totalReturn = 0;
        }
    }
    
    /**
     * @notice Update strategy status
     * @param strategyId Strategy ID
     * @param isActive New status
     */
    function updateStrategyStatus(
        uint256 strategyId,
        bool isActive
    ) external override onlyOwner {
        require(strategyId > 0 && strategyId < nextStrategyId, "Invalid strategy ID");
        strategies[strategyId].isActive = isActive;
    }

    // Admin functions
    
    /**
     * @notice Update rebalance threshold
     * @param newThreshold New threshold in basis points
     */
    function setRebalanceThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold <= 2000, "Threshold too high"); // Max 20%
        
        uint256 oldThreshold = rebalanceThreshold;
        rebalanceThreshold = newThreshold;
        
        emit RebalanceThresholdUpdated(oldThreshold, newThreshold);
    }
    
    /**
     * @notice Update rebalance interval
     * @param newInterval New interval in seconds
     */
    function setRebalanceInterval(uint256 newInterval) external onlyOwner {
        require(newInterval >= 1 hours, "Interval too short");
        require(newInterval <= 30 days, "Interval too long");
        
        uint256 oldInterval = rebalanceInterval;
        rebalanceInterval = newInterval;
        
        emit RebalanceIntervalUpdated(oldInterval, newInterval);
    }
    
    /**
     * @notice Update management fee
     * @param newFee New fee in basis points
     */
    function setManagementFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        
        uint256 oldFee = managementFee;
        managementFee = newFee;
        
        emit ManagementFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @notice Update performance fee
     * @param newFee New fee in basis points
     */
    function setPerformanceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 5000, "Fee too high"); // Max 50%
        
        uint256 oldFee = performanceFee;
        performanceFee = newFee;
        
        emit PerformanceFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @notice Update maximum limits
     * @param newMaxStrategies New max strategies per user
     * @param newMaxAssets New max assets per strategy
     * @param newMinInvestment New minimum investment amount
     */
    function setMaxLimits(
        uint256 newMaxStrategies,
        uint256 newMaxAssets,
        uint256 newMinInvestment
    ) external onlyOwner {
        require(newMaxStrategies > 0 && newMaxStrategies <= 50, "Invalid max strategies");
        require(newMaxAssets > 0 && newMaxAssets <= 100, "Invalid max assets");
        
        maxStrategiesPerUser = newMaxStrategies;
        maxAssetsPerStrategy = newMaxAssets;
        minInvestmentAmount = newMinInvestment;
        
        emit MaxLimitsUpdated(newMaxStrategies, newMaxAssets, newMinInvestment);
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
    
    /**
     * @notice Receive function for native token deposits
     */
    receive() external payable {
        // Allow contract to receive native tokens
    }
}