// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IRewardsDistributor.sol";
import "../interfaces/IDataTypes.sol";
import "../interfaces/IPortfolioManager.sol";
import "../interfaces/IRewardAssetFactory.sol";
import "../tokens/RWAToken.sol";

/**
 * @title RewardsDistributor
 * @notice Manages reward calculations and distributions for RWA token holders
 */
contract RewardsDistributor is IRewardsDistributor, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // State variables
    mapping(address => mapping(address => IDataTypes.RewardInfo)) public userRewards;
    mapping(address => uint256) public assetRewardMultipliers;
    mapping(address => uint256) public lastDistributionTime;
    mapping(address => uint256) public totalRewardsDistributed;
    
    // Asset and user tracking for monthly distribution
    address[] public trackedAssets;
    mapping(address => bool) public isAssetTracked;
    mapping(address => address[]) public assetUsers; // asset => users who have positions
    mapping(address => mapping(address => bool)) public isUserTrackedForAsset; // asset => user => bool
    mapping(address => uint256) public assetUserCount; // asset => number of users
    
    // Contract references
    IPortfolioManager public immutable portfolioManager;
    IRewardAssetFactory public immutable assetFactory;
    
    // Reward configuration
    uint256 public constant REWARD_PRECISION = 1e18;
    uint256 public constant SECONDS_PER_MONTH = 30 days;
    uint256 public constant BASE_REWARD_RATE = 500; // 5% annual base rate
    uint256 public constant MAX_REWARD_RATE = 2000; // 20% annual max rate
    
    // Distribution settings
    uint256 public distributionInterval = SECONDS_PER_MONTH;
    uint256 public minClaimAmount = 0.001 ether;
    bool public autoDistributionEnabled = true;
    
    // Reward pool
    mapping(address => uint256) public rewardPools;
    address public rewardToken; // Native token or ERC20 for rewards
    
    // Events
    event RewardPoolFunded(address indexed asset, uint256 amount);
    event RewardPoolWithdrawn(address indexed asset, uint256 amount);
    event DistributionIntervalUpdated(uint256 oldInterval, uint256 newInterval);
    event MinClaimAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event AutoDistributionToggled(bool enabled);
    event RewardTokenUpdated(address oldToken, address newToken);
    event MonthlyRewardsDistributed(address indexed asset, uint256 timestamp);
    event RewardMultiplierUpdated(address indexed asset, uint256 oldMultiplier, uint256 newMultiplier);
    
    modifier validAsset(address asset) {
        require(assetFactory.isValidAsset(asset), "Invalid asset");
        _;
    }
    
    modifier validUser(address user) {
        require(user != address(0), "Invalid user address");
        _;
    }
    
    constructor(
        address _portfolioManager,
        address _assetFactory,
        address _rewardToken
    ) Ownable(msg.sender) {
        require(_portfolioManager != address(0), "Invalid portfolio manager");
        require(_assetFactory != address(0), "Invalid asset factory");
        
        portfolioManager = IPortfolioManager(_portfolioManager);
        assetFactory = IRewardAssetFactory(_assetFactory);
        rewardToken = _rewardToken;
    }
    
    /**
     * @notice Calculate reward for a user's asset holding (interface implementation)
     * @param user User address
     * @param asset Asset address
     * @param amount Amount of tokens held
     * @param holdingPeriod Holding period in seconds
     * @return Calculated reward amount
     */
    function calculateReward(
        address user,
        address asset,
        uint256 amount,
        uint256 holdingPeriod
    ) external view override validUser(user) validAsset(asset) returns (uint256) {
        if (amount == 0 || holdingPeriod == 0) return 0;
        
        // Get asset information
        IDataTypes.AssetInfo memory assetInfo = assetFactory.getAssetInfo(asset);
        uint256 positionValue = amount * assetInfo.pricePerToken;
        
        // Calculate base reward rate
        uint256 rewardMultiplier = assetRewardMultipliers[asset];
        if (rewardMultiplier == 0) {
            rewardMultiplier = BASE_REWARD_RATE;
        }
        
        // Apply time-based calculation
        uint256 annualReward = (positionValue * rewardMultiplier) / 10000;
        uint256 timeBasedReward = (annualReward * holdingPeriod) / (365 days);
        
        return timeBasedReward;
    }
    
    /**
     * @notice Calculate reward for a user's asset holding (internal)
     * @param user User address
     * @param asset Asset address
     * @return Calculated reward amount
     */
    function calculateReward(
        address user,
        address asset
    ) public view validUser(user) validAsset(asset) returns (uint256) {
        IDataTypes.Position memory position = portfolioManager.getPosition(user, asset);
        if (position.amount == 0) return 0;
        
        IDataTypes.RewardInfo memory rewardInfo = userRewards[user][asset];
        uint256 timeSinceLastClaim = block.timestamp - rewardInfo.timestamp;
        
        if (timeSinceLastClaim == 0) return 0;
        
        // Get asset information
        IDataTypes.AssetInfo memory assetInfo = assetFactory.getAssetInfo(asset);
        uint256 positionValue = position.amount * assetInfo.pricePerToken;
        
        // Calculate base reward rate
        uint256 rewardMultiplier = assetRewardMultipliers[asset];
        if (rewardMultiplier == 0) {
            rewardMultiplier = BASE_REWARD_RATE;
        }
        
        // Apply time-based calculation
        uint256 annualReward = (positionValue * rewardMultiplier) / 10000;
        uint256 timeBasedReward = (annualReward * timeSinceLastClaim) / (365 days);
        
        return timeBasedReward;
    }
    
    /**
     * @notice Claim rewards for a specific asset
     * @param asset Asset address
     * @return Amount of rewards claimed
     */
    function claimReward(address asset) external override nonReentrant whenNotPaused validAsset(asset) returns (uint256) {
        address user = msg.sender;
        uint256 rewardAmount = calculateReward(user, asset);
        
        require(rewardAmount >= minClaimAmount, "Reward amount too small");
        require(rewardPools[asset] >= rewardAmount, "Insufficient reward pool");
        
        // Update user reward info
        userRewards[user][asset].timestamp = block.timestamp;
        userRewards[user][asset].totalClaimed += rewardAmount;
        userRewards[user][asset].pendingRewards = 0;
        
        // Update pool and totals
        rewardPools[asset] -= rewardAmount;
        totalRewardsDistributed[asset] += rewardAmount;
        
        // Transfer rewards
        if (rewardToken == address(0)) {
            // Native token rewards
            payable(user).transfer(rewardAmount);
        } else {
            // ERC20 token rewards
            IERC20(rewardToken).safeTransfer(user, rewardAmount);
        }
        
        emit RewardClaimed(user, asset, rewardAmount);
        
        return rewardAmount;
    }
    
    /**
     * @notice Claim rewards for all user's assets
     * @return Total amount of rewards claimed
     */
    function claimAllRewards() external override nonReentrant whenNotPaused returns (uint256) {
        address user = msg.sender;
        address[] memory userAssets = portfolioManager.getUserAssets(user);
        uint256 totalClaimed = 0;
        
        for (uint256 i = 0; i < userAssets.length; i++) {
            address asset = userAssets[i];
            uint256 rewardAmount = calculateReward(user, asset);
            
            if (rewardAmount >= minClaimAmount && rewardPools[asset] >= rewardAmount) {
                // Update user reward info
                userRewards[user][asset].timestamp = block.timestamp;
                userRewards[user][asset].totalClaimed += rewardAmount;
                userRewards[user][asset].pendingRewards = 0;
                
                // Update pool and totals
                rewardPools[asset] -= rewardAmount;
                totalRewardsDistributed[asset] += rewardAmount;
                totalClaimed += rewardAmount;
                
                emit RewardClaimed(user, asset, rewardAmount);
            }
        }
        
        require(totalClaimed > 0, "No rewards to claim");
        
        // Transfer total rewards
        if (rewardToken == address(0)) {
            payable(user).transfer(totalClaimed);
        } else {
            IERC20(rewardToken).safeTransfer(user, totalClaimed);
        }
        
        return totalClaimed;
    }
    
    /**
     * @notice Distribute monthly rewards to all eligible users
     */
    function distributeMonthlyRewards() external override onlyOwner nonReentrant whenNotPaused {
        uint256 totalDistributed = 0;
        uint256 recipientCount = 0;
        
        // Step 1: Get all active assets from the factory
        address[] memory allAssets = assetFactory.getAllAssets();
        
        // Step 2: Process each asset
        for (uint256 i = 0; i < allAssets.length; i++) {
            address asset = allAssets[i];
            
            // Skip if asset is not active or distribution interval not reached
            if (!assetFactory.isValidAsset(asset)) continue;
            if (block.timestamp < lastDistributionTime[asset] + distributionInterval) continue;
            
            // Check if there are sufficient funds in the reward pool
            uint256 poolBalance = rewardPools[asset];
            if (poolBalance == 0) continue;
            
            // Step 3: Get users who have positions in this asset via PortfolioManager
            // Note: Since we don't have a direct way to enumerate all users,
            // we'll distribute to tracked users for this asset
            address[] memory users = assetUsers[asset];
            
            uint256 assetDistributed = 0;
            uint256 assetRecipients = 0;
            
            // Step 4: Calculate and distribute rewards to each eligible user
            for (uint256 j = 0; j < users.length; j++) {
                address user = users[j];
                
                // Check if user still has an active position
                IDataTypes.Position memory position = portfolioManager.getPosition(user, asset);
                if (position.amount == 0 || !position.isActive) {
                    continue;
                }
                
                // Check if user is eligible for rewards (minimum holding period, etc.)
                if (!this.isEligibleForReward(user, asset)) {
                    continue;
                }
                
                // Calculate reward amount for this user
                uint256 rewardAmount = calculateReward(user, asset);
                
                // Skip if reward is too small or exceeds remaining pool balance
                if (rewardAmount < minClaimAmount || rewardAmount > (poolBalance - assetDistributed)) {
                    continue;
                }
                
                // Distribute the reward
                bool success = _distributeRewardToUser(user, asset, rewardAmount);
                
                if (success) {
                    assetDistributed += rewardAmount;
                    assetRecipients++;
                    
                    // Update user's last reward claim time
                    userRewards[user][asset].timestamp = block.timestamp;
                    userRewards[user][asset].totalClaimed += rewardAmount;
                    userRewards[user][asset].pendingRewards = 0;
                    
                    emit RewardClaimed(user, asset, rewardAmount);
                }
                
                // Break if we've exhausted the pool for this asset
                if (assetDistributed >= poolBalance) break;
            }
            
            // Step 5: Update asset-specific tracking
            if (assetDistributed > 0) {
                rewardPools[asset] -= assetDistributed;
                totalRewardsDistributed[asset] += assetDistributed;
                lastDistributionTime[asset] = block.timestamp;
                
                totalDistributed += assetDistributed;
                recipientCount += assetRecipients;
                
                emit MonthlyRewardsDistributed(asset, block.timestamp);
            }
        }
        
        // Step 6: Emit global monthly distribution event
        emit MonthlyRewardDistributed(totalDistributed, recipientCount);
        
        // Step 7: Clean up inactive users from tracking (optional gas optimization)
        if (recipientCount > 0) {
            _cleanupInactiveUsers();
        }
    }
    
    /**
     * @notice Distribute monthly rewards to all eligible users for specific asset
     * @param asset Asset address
     */
    function distributeMonthlyRewards(address asset) external onlyOwner validAsset(asset) {
        require(
            block.timestamp >= lastDistributionTime[asset] + distributionInterval,
            "Distribution interval not reached"
        );
        
        lastDistributionTime[asset] = block.timestamp;
        
        emit MonthlyRewardsDistributed(asset, block.timestamp);
    }
    
    /**
     * @notice Set reward multiplier for an asset
     * @param asset Asset address
     * @param multiplier Reward multiplier (in basis points)
     */
    function setRewardMultiplier(
        address asset,
        uint256 multiplier
    ) external override onlyOwner validAsset(asset) {
        require(multiplier <= MAX_REWARD_RATE, "Multiplier too high");
        
        uint256 oldMultiplier = assetRewardMultipliers[asset];
        assetRewardMultipliers[asset] = multiplier;
        
        emit RewardMultiplierUpdated(asset, oldMultiplier, multiplier);
    }
    
    /**
     * @notice Get user's reward information for an asset
     * @param user User address
     * @param asset Asset address
     * @return Reward information
     */
    function getUserRewardInfo(
        address user,
        address asset
    ) external view validUser(user) validAsset(asset) returns (IDataTypes.RewardInfo memory) {
        return userRewards[user][asset];
    }
    
    /**
     * @notice Get pending rewards for a user's asset
     * @param user User address
     * @param asset Asset address
     * @return Pending reward amount
     */
    function getPendingRewards(
        address user,
        address asset
    ) external view validUser(user) validAsset(asset) returns (uint256) {
        return calculateReward(user, asset);
    }
    
    /**
     * @notice Get total rewards distributed for an asset
     * @param asset Asset address
     * @return Total distributed amount
     */
    function getTotalRewardsDistributed(address asset) external view validAsset(asset) returns (uint256) {
        return totalRewardsDistributed[asset];
    }
    
    /**
     * @notice Fund reward pool for an asset
     * @param asset Asset address
     */
    function fundRewardPool(address asset) external payable validAsset(asset) {
        require(msg.value > 0, "Must send funds");
        
        rewardPools[asset] += msg.value;
        
        emit RewardPoolFunded(asset, msg.value);
    }
    
    /**
     * @notice Fund reward pool with ERC20 tokens
     * @param asset Asset address
     * @param amount Amount to fund
     */
    function fundRewardPoolWithToken(address asset, uint256 amount) external validAsset(asset) {
        require(rewardToken != address(0), "No reward token set");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(rewardToken).safeTransferFrom(msg.sender, address(this), amount);
        rewardPools[asset] += amount;
        
        emit RewardPoolFunded(asset, amount);
    }
    
    /**
     * @notice Withdraw from reward pool (owner only)
     * @param asset Asset address
     * @param amount Amount to withdraw
     */
    function withdrawFromRewardPool(address asset, uint256 amount) external onlyOwner validAsset(asset) {
        require(amount <= rewardPools[asset], "Insufficient pool balance");
        
        rewardPools[asset] -= amount;
        
        if (rewardToken == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(rewardToken).safeTransfer(owner(), amount);
        }
        
        emit RewardPoolWithdrawn(asset, amount);
    }
    
    /**
     * @notice Set distribution interval
     * @param newInterval New interval in seconds
     */
    function setDistributionInterval(uint256 newInterval) external onlyOwner {
        require(newInterval >= 1 days, "Interval too short");
        require(newInterval <= 90 days, "Interval too long");
        
        uint256 oldInterval = distributionInterval;
        distributionInterval = newInterval;
        
        emit DistributionIntervalUpdated(oldInterval, newInterval);
    }
    
    /**
     * @notice Set minimum claim amount
     * @param newAmount New minimum amount
     */
    function setMinClaimAmount(uint256 newAmount) external onlyOwner {
        uint256 oldAmount = minClaimAmount;
        minClaimAmount = newAmount;
        
        emit MinClaimAmountUpdated(oldAmount, newAmount);
    }
    
    /**
     * @notice Toggle auto distribution
     * @param enabled Enable/disable auto distribution
     */
    function setAutoDistribution(bool enabled) external onlyOwner {
        autoDistributionEnabled = enabled;
        emit AutoDistributionToggled(enabled);
    }
    
    /**
     * @notice Set reward token
     * @param newRewardToken New reward token address (address(0) for native)
     */
    function setRewardToken(address newRewardToken) external onlyOwner {
        address oldToken = rewardToken;
        rewardToken = newRewardToken;
        
        emit RewardTokenUpdated(oldToken, newRewardToken);
    }
    
    /**
     * @notice Initialize user reward tracking
     * @param user User address
     * @param asset Asset address
     */
    function initializeUserReward(address user, address asset) external validUser(user) validAsset(asset) {
        if (userRewards[user][asset].timestamp == 0) {
            userRewards[user][asset] = IDataTypes.RewardInfo({
                recipient: user,
                asset: asset,
                amount: 0,
                multiplier: BASE_REWARD_RATE,
                timestamp: block.timestamp,
                isClaimed: false,
                rewardType: "base",
                totalClaimed: 0,
                pendingRewards: 0
            });
        }
    }
    
    /**
     * @notice Get pending rewards for a user (all assets)
     * @param user User address
     * @return Array of pending reward info
     */
    function getPendingRewards(address user) external view override validUser(user) returns (IDataTypes.RewardInfo[] memory) {
        address[] memory userAssets = portfolioManager.getUserAssets(user);
        IDataTypes.RewardInfo[] memory pendingRewards = new IDataTypes.RewardInfo[](userAssets.length);
        
        for (uint256 i = 0; i < userAssets.length; i++) {
            address asset = userAssets[i];
            uint256 pendingAmount = calculateReward(user, asset);
            
            pendingRewards[i] = IDataTypes.RewardInfo({
                recipient: user,
                asset: asset,
                amount: pendingAmount,
                multiplier: assetRewardMultipliers[asset] > 0 ? assetRewardMultipliers[asset] : BASE_REWARD_RATE,
                timestamp: block.timestamp,
                isClaimed: false,
                rewardType: "pending",
                totalClaimed: userRewards[user][asset].totalClaimed,
                pendingRewards: pendingAmount
            });
        }
        
        return pendingRewards;
    }
    
    /**
     * @notice Get total rewards for a user across all assets
     * @param user User address
     * @return Total reward amount
     */
    function getTotalRewards(address user) external view override validUser(user) returns (uint256) {
        address[] memory userAssets = portfolioManager.getUserAssets(user);
        uint256 totalRewards = 0;
        
        for (uint256 i = 0; i < userAssets.length; i++) {
            address asset = userAssets[i];
            totalRewards += userRewards[user][asset].totalClaimed;
            totalRewards += calculateReward(user, asset); // Add pending rewards
        }
        
        return totalRewards;
    }
    
    /**
     * @notice Get reward multiplier for an asset
     * @param asset Asset address
     * @return Current multiplier
     */
    function getRewardMultiplier(address asset) external view override validAsset(asset) returns (uint256) {
        uint256 multiplier = assetRewardMultipliers[asset];
        return multiplier > 0 ? multiplier : BASE_REWARD_RATE;
    }
    
    /**
     * @notice Update reward calculation for a user's asset
     * @param user User address
     * @param asset Asset address
     * @param newAmount New amount (not used in current implementation)
     */
    function updateRewardCalculation(
        address user,
        address asset,
        uint256 newAmount
    ) external override validUser(user) validAsset(asset) {
        // Update the user's reward info timestamp to current time
        // This effectively resets the reward calculation period
        userRewards[user][asset].timestamp = block.timestamp;
        userRewards[user][asset].pendingRewards = 0;
    }
    
    /**
     * @notice Get last claim time for a user
     * @param user User address
     * @return Last claim timestamp (average across all assets)
     */
    function getLastClaimTime(address user) external view override validUser(user) returns (uint256) {
        address[] memory userAssets = portfolioManager.getUserAssets(user);
        if (userAssets.length == 0) return 0;
        
        uint256 totalTime = 0;
        uint256 validAssets = 0;
        
        for (uint256 i = 0; i < userAssets.length; i++) {
            address asset = userAssets[i];
            uint256 lastTime = userRewards[user][asset].timestamp;
            if (lastTime > 0) {
                totalTime += lastTime;
                validAssets++;
            }
        }
        
        return validAssets > 0 ? totalTime / validAssets : 0;
    }
    
    /**
     * @notice Check if user is eligible for reward
     * @param user User address
     * @param asset Asset address
     * @return True if eligible
     */
    function isEligibleForReward(
        address user,
        address asset
    ) external view override validUser(user) validAsset(asset) returns (bool) {
        // Check if user has a position in this asset
        IDataTypes.Position memory position = portfolioManager.getPosition(user, asset);
        if (position.amount == 0 || !position.isActive) {
            return false;
        }
        
        // Check if enough time has passed since last claim
        IDataTypes.RewardInfo memory rewardInfo = userRewards[user][asset];
        uint256 timeSinceLastClaim = block.timestamp - rewardInfo.timestamp;
        
        // Must wait at least 1 day between claims
        return timeSinceLastClaim >= 1 days;
    }
    
    /**
     * @notice Get reward pool balance
     * @param asset Asset address
     * @return Pool balance
     */
    function getRewardPoolBalance(address asset) external view validAsset(asset) returns (uint256) {
        return rewardPools[asset];
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
    function emergencyWithdraw() external onlyOwner {
        if (rewardToken == address(0)) {
            payable(owner()).transfer(address(this).balance);
        } else {
            uint256 balance = IERC20(rewardToken).balanceOf(address(this));
            IERC20(rewardToken).safeTransfer(owner(), balance);
        }
    }
    
    /**
     * @notice Add user to asset tracking
     * @param user User address
     * @param asset Asset address
     */
    function addUserToAssetTracking(address user, address asset) external {
        require(msg.sender == address(portfolioManager) || msg.sender == owner(), "Unauthorized");
        
        if (!isUserTrackedForAsset[asset][user]) {
            assetUsers[asset].push(user);
            isUserTrackedForAsset[asset][user] = true;
            assetUserCount[asset]++;
            
            // Track asset if not already tracked
            if (!isAssetTracked[asset]) {
                trackedAssets.push(asset);
                isAssetTracked[asset] = true;
            }
            
            // Initialize user reward info if needed
            if (userRewards[user][asset].timestamp == 0) {
                userRewards[user][asset] = IDataTypes.RewardInfo({
                    recipient: user,
                    asset: asset,
                    amount: 0,
                    multiplier: BASE_REWARD_RATE,
                    timestamp: block.timestamp,
                    isClaimed: false,
                    rewardType: "base",
                    totalClaimed: 0,
                    pendingRewards: 0
                });
            }
        }
    }
    
    /**
     * @notice Remove user from asset tracking
     * @param user User address
     * @param asset Asset address
     */
    function removeUserFromAssetTracking(address user, address asset) external {
        require(msg.sender == address(portfolioManager) || msg.sender == owner(), "Unauthorized");
        
        if (isUserTrackedForAsset[asset][user]) {
            // Remove user from asset users array
            address[] storage users = assetUsers[asset];
            for (uint256 i = 0; i < users.length; i++) {
                if (users[i] == user) {
                    users[i] = users[users.length - 1];
                    users.pop();
                    break;
                }
            }
            
            isUserTrackedForAsset[asset][user] = false;
            assetUserCount[asset]--;
        }
    }
    
    /**
     * @notice Internal function to distribute reward to a specific user
     * @param user User address
     * @param asset Asset address
     * @param amount Reward amount
     * @return success True if distribution was successful
     */
    function _distributeRewardToUser(address user, address asset, uint256 amount) internal returns (bool) {
        try this._safeTransferReward(user, amount) {
            return true;
        } catch {
            // If transfer fails, we'll skip this user and continue
            return false;
        }
    }
    
    /**
     * @notice Safe reward transfer function
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function _safeTransferReward(address to, uint256 amount) external {
        require(msg.sender == address(this), "Internal function only");
        
        if (rewardToken == address(0)) {
            // Native token transfer
            payable(to).transfer(amount);
        } else {
            // ERC20 token transfer
            IERC20(rewardToken).safeTransfer(to, amount);
        }
    }
    
    /**
     * @notice Clean up inactive users from tracking (gas optimization)
     */
    function _cleanupInactiveUsers() internal {
        // Limit cleanup to prevent excessive gas usage
        uint256 maxCleanupPerCall = 10;
        uint256 cleanupCount = 0;
        
        for (uint256 i = 0; i < trackedAssets.length && cleanupCount < maxCleanupPerCall; i++) {
            address asset = trackedAssets[i];
            address[] storage users = assetUsers[asset];
            
            for (uint256 j = 0; j < users.length && cleanupCount < maxCleanupPerCall; j++) {
                address user = users[j];
                
                // Check if user still has an active position
                IDataTypes.Position memory position = portfolioManager.getPosition(user, asset);
                if (position.amount == 0 || !position.isActive) {
                    // Remove inactive user
                    users[j] = users[users.length - 1];
                    users.pop();
                    isUserTrackedForAsset[asset][user] = false;
                    assetUserCount[asset]--;
                    cleanupCount++;
                    j--; // Adjust index after removal
                }
            }
        }
    }
    
    /**
     * @notice Get tracked assets count
     * @return Number of tracked assets
     */
    function getTrackedAssetsCount() external view returns (uint256) {
        return trackedAssets.length;
    }
    
    /**
     * @notice Get tracked assets
     * @return Array of tracked asset addresses
     */
    function getTrackedAssets() external view returns (address[] memory) {
        return trackedAssets;
    }
    
    /**
     * @notice Get users for a specific asset
     * @param asset Asset address
     * @return Array of user addresses
     */
    function getAssetUsers(address asset) external view returns (address[] memory) {
        return assetUsers[asset];
    }
    
    /**
     * @notice Get user count for a specific asset
     * @param asset Asset address
     * @return Number of users holding the asset
     */
    function getAssetUserCount(address asset) external view returns (uint256) {
        return assetUserCount[asset];
    }
    
    /**
     * @notice Check if user is tracked for an asset
     * @param user User address
     * @param asset Asset address
     * @return True if user is tracked
     */
    function isUserTracked(address user, address asset) external view returns (bool) {
        return isUserTrackedForAsset[asset][user];
    }
    
    /**
     * @notice Emergency function to manually clean up all inactive users
     */
    function forceCleanupInactiveUsers() external onlyOwner {
        for (uint256 i = 0; i < trackedAssets.length; i++) {
            address asset = trackedAssets[i];
            address[] storage users = assetUsers[asset];
            
            for (uint256 j = 0; j < users.length; j++) {
                address user = users[j];
                
                // Check if user still has an active position
                IDataTypes.Position memory position = portfolioManager.getPosition(user, asset);
                if (position.amount == 0 || !position.isActive) {
                    // Remove inactive user
                    users[j] = users[users.length - 1];
                    users.pop();
                    isUserTrackedForAsset[asset][user] = false;
                    assetUserCount[asset]--;
                    j--; // Adjust index after removal
                }
            }
        }
    }
    
    /**
     * @notice Receive function for native token deposits
     */
    receive() external payable {
        // Allow contract to receive native tokens
    }
}