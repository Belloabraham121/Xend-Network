// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IDataTypes.sol";

/**
 * @title RWAToken
 * @notice ERC20 token representing Real World Assets with reward functionality
 */
contract RWAToken is ERC20, ERC20Burnable, Ownable, Pausable {
    // Asset information
    IDataTypes.AssetType public assetType;
    uint256 public pricePerToken;
    uint256 public createdAt;
    address public factory;
    bool public isActive;
    
    // Reward tracking
    mapping(address => uint256) public lastRewardClaim;
    mapping(address => uint256) public totalRewardsClaimed;
    uint256 public rewardMultiplier; // Basis points (10000 = 100%)
    
    // Transfer restrictions
    mapping(address => bool) public authorizedTransfers;
    bool public transfersEnabled;
    
    // Events
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event RewardClaimed(address indexed user, uint256 amount);
    event TransferAuthorized(address indexed account, bool authorized);
    event TransfersToggled(bool enabled);
    event AssetDeactivated();
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this function");
        _;
    }
    
    modifier onlyActiveAsset() {
        require(isActive, "Asset is not active");
        _;
    }
    
    constructor(
        string memory name,
        string memory symbol,
        IDataTypes.AssetType _assetType,
        uint256 _initialSupply,
        uint256 _pricePerToken,
        address _owner,
        address _factory
    ) ERC20(name, symbol) Ownable(msg.sender) {
        assetType = _assetType;
        pricePerToken = _pricePerToken;
        createdAt = block.timestamp;
        factory = _factory;
        isActive = true;
        transfersEnabled = true;
        rewardMultiplier = 1000; // 10% default reward multiplier
        
        _mint(_owner, _initialSupply);
        _transferOwnership(_owner);
    }
    
    /**
     * @notice Update the price per token
     * @param newPrice New price per token
     */
    function updatePrice(uint256 newPrice) external onlyFactory onlyActiveAsset {
        uint256 oldPrice = pricePerToken;
        pricePerToken = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }
    
    /**
     * @notice Deactivate the asset
     */
    function deactivate() external onlyFactory {
        isActive = false;
        _pause();
        emit AssetDeactivated();
    }
    
    /**
     * @notice Set reward multiplier
     * @param multiplier New reward multiplier in basis points
     */
    function setRewardMultiplier(uint256 multiplier) external onlyOwner {
        require(multiplier <= 10000, "Multiplier cannot exceed 100%");
        rewardMultiplier = multiplier;
    }
    
    /**
     * @notice Calculate pending rewards for a user
     * @param user User address
     * @return Pending reward amount
     */
    function calculatePendingRewards(address user) public view returns (uint256) {
        uint256 balance = balanceOf(user);
        if (balance == 0) return 0;
        
        uint256 timeSinceLastClaim = block.timestamp - lastRewardClaim[user];
        if (timeSinceLastClaim == 0) return 0;
        
        // Calculate rewards based on holding time and multiplier
        uint256 rewardRate = (rewardMultiplier * timeSinceLastClaim) / (365 days * 10000);
        return (balance * rewardRate) / 1e18;
    }
    
    /**
     * @notice Claim pending rewards
     * @return Amount of rewards claimed
     */
    function claimRewards() external onlyActiveAsset returns (uint256) {
        uint256 rewards = calculatePendingRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        
        lastRewardClaim[msg.sender] = block.timestamp;
        totalRewardsClaimed[msg.sender] += rewards;
        
        // Mint reward tokens
        _mint(msg.sender, rewards);
        
        emit RewardClaimed(msg.sender, rewards);
        return rewards;
    }
    
    /**
     * @notice Get asset information
     * @return Asset information struct
     */
    function getAssetInfo() external view returns (IDataTypes.AssetInfo memory) {
        return IDataTypes.AssetInfo({
            name: name(),
            symbol: symbol(),
            assetType: assetType,
            totalSupply: totalSupply(),
            pricePerToken: pricePerToken,
            tokenAddress: address(this),
            isActive: isActive,
            createdAt: createdAt,
            creator: owner()
        });
    }
    
    /**
     * @notice Authorize/deauthorize transfers for an account
     * @param account Account to authorize
     * @param authorized Authorization status
     */
    function setTransferAuthorization(address account, bool authorized) external onlyOwner {
        authorizedTransfers[account] = authorized;
        emit TransferAuthorized(account, authorized);
    }
    
    /**
     * @notice Toggle transfers for all users
     * @param enabled Transfer status
     */
    function setTransfersEnabled(bool enabled) external onlyOwner {
        transfersEnabled = enabled;
        emit TransfersToggled(enabled);
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
     * @notice Override update function to include restrictions
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        if (from != address(0) && to != address(0)) {
            require(
                transfersEnabled || 
                authorizedTransfers[from] || 
                authorizedTransfers[to],
                "Transfers not authorized"
            );
        }
        
        // Update reward claim timestamps on transfer
        if (from != address(0) && lastRewardClaim[from] == 0) {
            lastRewardClaim[from] = block.timestamp;
        }
        if (to != address(0) && lastRewardClaim[to] == 0) {
            lastRewardClaim[to] = block.timestamp;
        }
        
        super._update(from, to, value);
    }
    
    /**
     * @notice Get total value of user's holdings
     * @param user User address
     * @return Total value in wei
     */
    function getUserValue(address user) external view returns (uint256) {
        return (balanceOf(user) * pricePerToken) / 1e18;
    }
    
    /**
     * @notice Emergency withdrawal function for owner
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
}