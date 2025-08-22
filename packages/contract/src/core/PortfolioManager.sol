// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IPortfolioManager.sol";
import "../interfaces/IDataTypes.sol";
import "../interfaces/IRewardAssetFactory.sol";

/**
 * @title PortfolioManager
 * @notice Manages user portfolios and positions
 */
contract PortfolioManager is IPortfolioManager, Ownable, ReentrancyGuard, Pausable {
    // State variables
    mapping(address => IDataTypes.Portfolio) public portfolios;
    mapping(address => mapping(address => IDataTypes.Position)) public positions;
    mapping(address => address[]) public userAssets;
    
    // Risk management
    uint256 public constant MAX_RISK_SCORE = 100;
    uint256 public constant HIGH_RISK_THRESHOLD = 80;
    uint256 public constant MEDIUM_RISK_THRESHOLD = 50;
    
    // Portfolio limits
    uint256 public maxPositionsPerUser = 50;
    uint256 public minPositionValue = 0.001 ether;
    
    // Asset factory reference
    IRewardAssetFactory public immutable assetFactory;
    
    // Risk weights by asset type
    mapping(IDataTypes.AssetType => uint256) public assetTypeRiskWeights;
    
    // Events
    event PortfolioCreated(address indexed user, uint256 timestamp);
    event PortfolioRebalanced(address indexed user, uint256 newRiskScore, uint256 timestamp);
    event RiskThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event MaxPositionsUpdated(uint256 oldMax, uint256 newMax);
    event MinPositionValueUpdated(uint256 oldMin, uint256 newMin);
    event AllPricesUpdated(uint256 updatedCount, uint256 timestamp);
    event AssetPriceUpdated(address indexed asset, uint256 newPrice, uint256 timestamp);
    
    modifier validUser(address user) {
        require(user != address(0), "Invalid user address");
        _;
    }
    
    modifier validAsset(address asset) {
        require(assetFactory.isValidAsset(asset), "Invalid asset");
        _;
    }
    
    modifier hasPosition(address user, address asset) {
        require(positions[user][asset].amount > 0, "No position found");
        _;
    }
    
    constructor(address _assetFactory) Ownable(msg.sender) {
        require(_assetFactory != address(0), "Invalid asset factory");
        assetFactory = IRewardAssetFactory(_assetFactory);
        
        // Initialize risk weights
        assetTypeRiskWeights[IDataTypes.AssetType.GOLD] = 20;
        assetTypeRiskWeights[IDataTypes.AssetType.SILVER] = 25;
        assetTypeRiskWeights[IDataTypes.AssetType.REAL_ESTATE] = 30;
        assetTypeRiskWeights[IDataTypes.AssetType.ART] = 60;
        assetTypeRiskWeights[IDataTypes.AssetType.OIL] = 70;
        assetTypeRiskWeights[IDataTypes.AssetType.CUSTOM] = 50;
    }
    
    /**
     * @notice Add a position to user's portfolio
     * @param user User address
     * @param asset Asset address
     * @param amount Amount of tokens
     * @param averagePrice Average price paid
     */
    function addPosition(
        address user,
        address asset,
        uint256 amount,
        uint256 averagePrice
    ) external override nonReentrant whenNotPaused validUser(user) validAsset(asset) {
        require(amount > 0, "Amount must be greater than 0");
        require(averagePrice > 0, "Average price must be greater than 0");
        
        // Check if user has reached max positions
        if (positions[user][asset].amount == 0) {
            require(userAssets[user].length < maxPositionsPerUser, "Max positions reached");
        }
        
        uint256 positionValue = amount * averagePrice;
        require(positionValue >= minPositionValue, "Position value too small");
        
        // Initialize portfolio if it doesn't exist
        if (portfolios[user].owner == address(0)) {
            portfolios[user] = IDataTypes.Portfolio({
                owner: user,
                positions: new IDataTypes.Position[](0),
                totalValue: 0,
                totalRewards: 0,
                lastRewardClaim: 0,
                riskScore: 0
            });
            
            // Track new portfolio
            if (!hasPortfolio[user]) {
                portfolioOwners.push(user);
                hasPortfolio[user] = true;
                totalActivePortfolios++;
            }
            
            emit PortfolioCreated(user, block.timestamp);
        }
        
        // Update or create position
        if (positions[user][asset].amount == 0) {
            // New position
            positions[user][asset] = IDataTypes.Position({
                tokenAddress: asset,
                amount: amount,
                value: amount * averagePrice,
                entryPrice: averagePrice,
                currentPrice: averagePrice,
                lastUpdated: block.timestamp,
                isActive: true
            });
            userAssets[user].push(asset);
        } else {
            // Update existing position
            IDataTypes.Position storage position = positions[user][asset];
            uint256 totalCost = (position.amount * position.entryPrice) + (amount * averagePrice);
            uint256 totalAmount = position.amount + amount;
            
            position.amount = totalAmount;
            position.entryPrice = totalCost / totalAmount;
            position.currentPrice = averagePrice;
            position.value = totalAmount * position.entryPrice;
            position.lastUpdated = block.timestamp;
        }
        
        // Update portfolio
        _updatePortfolio(user);
        
        emit PositionAdded(user, asset, amount, averagePrice);
    }
    
    /**
     * @notice Update a position in user's portfolio
     * @param user User address
     * @param asset Asset address
     * @param newAmount New amount of tokens
     * @param newAveragePrice New average price
     */
    function updatePosition(
        address user,
        address asset,
        uint256 newAmount,
        uint256 newAveragePrice
    ) external override nonReentrant whenNotPaused validUser(user) validAsset(asset) hasPosition(user, asset) {
        require(newAmount > 0, "Amount must be greater than 0");
        require(newAveragePrice > 0, "Average price must be greater than 0");
        
        uint256 positionValue = newAmount * newAveragePrice;
        require(positionValue >= minPositionValue, "Position value too small");
        
        IDataTypes.Position storage position = positions[user][asset];
        position.amount = newAmount;
        position.entryPrice = newAveragePrice;
        position.currentPrice = newAveragePrice;
        position.value = newAmount * newAveragePrice;
        position.lastUpdated = block.timestamp;
        
        // Update portfolio
        _updatePortfolio(user);
        
        emit PositionUpdated(user, asset, newAmount, newAveragePrice);
    }
    
    /**
     * @notice Remove a position from user's portfolio
     * @param user User address
     * @param asset Asset address
     */
    function removePosition(
        address user,
        address asset
    ) external override nonReentrant whenNotPaused validUser(user) validAsset(asset) hasPosition(user, asset) {
        // Remove from positions mapping
        delete positions[user][asset];
        
        // Remove from user assets array
        address[] storage assets = userAssets[user];
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i] == asset) {
                assets[i] = assets[assets.length - 1];
                assets.pop();
                break;
            }
        }
        
        // Update portfolio
        _updatePortfolio(user);
        
        emit PositionRemoved(user, asset);
    }
    
    /**
     * @notice Get user's portfolio
     * @param user User address
     * @return Portfolio information
     */
    function getPortfolio(address user) external view override validUser(user) returns (IDataTypes.Portfolio memory) {
        return portfolios[user];
    }
    
    /**
     * @notice Get user's position for a specific asset
     * @param user User address
     * @param asset Asset address
     * @return Position information
     */
    function getPosition(address user, address asset) external view override validUser(user) validAsset(asset) returns (IDataTypes.Position memory) {
        return positions[user][asset];
    }
    
    /**
     * @notice Get all user's positions
     * @param user User address
     * @return Array of positions
     */
    function getUserPositions(address user) external view validUser(user) returns (IDataTypes.Position[] memory) {
        address[] memory assets = userAssets[user];
        IDataTypes.Position[] memory userPositions = new IDataTypes.Position[](assets.length);
        
        for (uint256 i = 0; i < assets.length; i++) {
            userPositions[i] = positions[user][assets[i]];
        }
        
        return userPositions;
    }
    
    /**
     * @notice Calculate portfolio risk score
     * @param user User address
     * @return Risk score (0-100)
     */
    function calculateRiskScore(address user) public view override validUser(user) returns (uint256) {
        address[] memory assets = userAssets[user];
        if (assets.length == 0) return 0;
        
        uint256 totalValue = 0;
        uint256 weightedRisk = 0;
        
        for (uint256 i = 0; i < assets.length; i++) {
            IDataTypes.Position memory position = positions[user][assets[i]];
            if (position.amount > 0) {
                IDataTypes.AssetInfo memory assetInfo = assetFactory.getAssetInfo(assets[i]);
                uint256 positionValue = position.amount * assetInfo.pricePerToken;
                uint256 riskWeight = assetTypeRiskWeights[assetInfo.assetType];
                
                totalValue += positionValue;
                weightedRisk += positionValue * riskWeight;
            }
        }
        
        return totalValue > 0 ? weightedRisk / totalValue : 0;
    }
    
    /**
     * @notice Rebalance user's portfolio
     * @param user User address
     */
    function rebalancePortfolio(address user) external override nonReentrant whenNotPaused validUser(user) {
        require(portfolios[user].owner != address(0), "Portfolio not found");
        
        uint256 currentRiskScore = calculateRiskScore(user);
        
        // Only rebalance if risk is too high
        if (currentRiskScore > HIGH_RISK_THRESHOLD) {
            // Update portfolio with new risk score
            portfolios[user].riskScore = currentRiskScore;
            
            emit PortfolioRebalanced(user, currentRiskScore, block.timestamp);
        }
    }
    
    /**
     * @notice Get user's asset addresses
     * @param user User address
     * @return Array of asset addresses
     */
    function getUserAssets(address user) external view override validUser(user) returns (address[] memory) {
        return userAssets[user];
    }
    
    /**
     * @notice Get portfolio total value
     * @param user User address
     * @return Total portfolio value in wei
     */
    function getTotalValue(address user) external view override validUser(user) returns (uint256) {
        address[] memory assets = userAssets[user];
        uint256 totalValue = 0;
        
        for (uint256 i = 0; i < assets.length; i++) {
            IDataTypes.Position memory position = positions[user][assets[i]];
            if (position.amount > 0) {
                IDataTypes.AssetInfo memory assetInfo = assetFactory.getAssetInfo(assets[i]);
                totalValue += position.amount * assetInfo.pricePerToken;
            }
        }
        
        return totalValue;
    }
    
    /**
     * @notice Get active positions for a user
     * @param user User address
     * @return Array of active positions
     */
    function getActivePositions(address user) external view override validUser(user) returns (IDataTypes.Position[] memory) {
        address[] memory assets = userAssets[user];
        uint256 activeCount = 0;
        
        // Count active positions
        for (uint256 i = 0; i < assets.length; i++) {
            if (positions[user][assets[i]].amount > 0 && positions[user][assets[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create result array with only active positions
        IDataTypes.Position[] memory activePositions = new IDataTypes.Position[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < assets.length; i++) {
            IDataTypes.Position memory position = positions[user][assets[i]];
            if (position.amount > 0 && position.isActive) {
                activePositions[index] = position;
                index++;
            }
        }
        
        return activePositions;
    }
    
    // Track all assets that have been added to portfolios
    address[] public trackedAssets;
    mapping(address => bool) public isAssetTracked;
    
    // Track all users with portfolios
    address[] public portfolioOwners;
    mapping(address => bool) public hasPortfolio;
    uint256 public totalActivePortfolios;
    
    /**
     * @notice Update all asset prices from oracle
     */
    function updateAllPrices() external override onlyOwner {
        uint256 updatedCount = 0;
        
        for (uint256 i = 0; i < trackedAssets.length; i++) {
            address asset = trackedAssets[i];
            
            // Get latest price from asset factory
            IDataTypes.AssetInfo memory assetInfo = assetFactory.getAssetInfo(asset);
            
            if (assetInfo.isActive && assetInfo.pricePerToken > 0) {
                // Update all positions for this asset across all users
                _updateAssetPricesForAllUsers(asset, assetInfo.pricePerToken);
                updatedCount++;
            }
        }
        
        emit AllPricesUpdated(updatedCount, block.timestamp);
    }
    
    /**
     * @notice Internal function to update asset price for all users
     * @param asset Asset address
     * @param newPrice New price per token
     */
    function _updateAssetPricesForAllUsers(address asset, uint256 newPrice) internal {
        // This would require a way to enumerate all users, which we don't have
        // In practice, this could be done through events or off-chain indexing
        // For now, we just emit an event that off-chain services can use
        emit AssetPriceUpdated(asset, newPrice, block.timestamp);
    }
    
    /**
     * @notice Get portfolio total value (backward compatibility)
     * @param user User address
     * @return Total portfolio value in wei
     */
    function getPortfolioValue(address user) external view validUser(user) returns (uint256) {
        return this.getTotalValue(user);
    }
    
    /**
     * @notice Internal function to update portfolio
     * @param user User address
     */
    function _updatePortfolio(address user) internal {
        uint256 totalValue = this.getPortfolioValue(user);
        uint256 riskScore = calculateRiskScore(user);
        
        portfolios[user].totalValue = totalValue;
        portfolios[user].riskScore = riskScore;
    }
    
    /**
     * @notice Set maximum positions per user
     * @param newMax New maximum positions
     */
    function setMaxPositionsPerUser(uint256 newMax) external onlyOwner {
        require(newMax > 0, "Max positions must be greater than 0");
        uint256 oldMax = maxPositionsPerUser;
        maxPositionsPerUser = newMax;
        emit MaxPositionsUpdated(oldMax, newMax);
    }
    
    /**
     * @notice Set minimum position value
     * @param newMin New minimum position value
     */
    function setMinPositionValue(uint256 newMin) external onlyOwner {
        uint256 oldMin = minPositionValue;
        minPositionValue = newMin;
        emit MinPositionValueUpdated(oldMin, newMin);
    }
    
    /**
     * @notice Set asset type risk weight
     * @param assetType Asset type
     * @param riskWeight Risk weight (0-100)
     */
    function setAssetTypeRiskWeight(IDataTypes.AssetType assetType, uint256 riskWeight) external onlyOwner {
        require(riskWeight <= MAX_RISK_SCORE, "Risk weight too high");
        assetTypeRiskWeights[assetType] = riskWeight;
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
     * @notice Get total number of active portfolios
     * @return Number of active portfolios
     */
    function getTotalActivePortfolios() external view returns (uint256) {
        return totalActivePortfolios;
    }
    
    /**
     * @notice Get all portfolio owners
     * @return Array of portfolio owner addresses
     */
    function getPortfolioOwners() external view returns (address[] memory) {
        return portfolioOwners;
    }
    
    /**
     * @notice Check if a user has a portfolio
     * @param user User address
     * @return True if user has a portfolio
     */
    function userHasPortfolio(address user) external view returns (bool) {
        return hasPortfolio[user];
    }
}