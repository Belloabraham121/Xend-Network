// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IRewardAssetFactory.sol";
import "../interfaces/IDataTypes.sol";
import "../tokens/RWAToken.sol";

/**
 * @title RewardAssetFactory
 * @notice Factory contract for creating and managing RWA tokens
 */
contract RewardAssetFactory is
    IRewardAssetFactory,
    Ownable,
    ReentrancyGuard,
    Pausable
{
    // State variables
    mapping(address => IDataTypes.AssetInfo) public assets;
    mapping(IDataTypes.AssetType => address[]) public assetsByType;
    address[] public allAssets;

    // Asset creation fee
    uint256 public creationFee;

    // Authorized creators
    mapping(address => bool) public authorizedCreators;

    // Asset type configurations
    mapping(IDataTypes.AssetType => bool) public enabledAssetTypes;

    // Events
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    event CreatorAuthorized(address indexed creator, bool authorized);
    event AssetTypeEnabled(IDataTypes.AssetType assetType, bool enabled);

    modifier onlyAuthorizedCreator() {
        require(
            authorizedCreators[msg.sender] || msg.sender == owner(),
            "Not authorized to create assets"
        );
        _;
    }

    modifier validAssetType(IDataTypes.AssetType assetType) {
        require(enabledAssetTypes[assetType], "Asset type not enabled");
        _;
    }

    modifier validAsset(address tokenAddress) {
        require(_isValidAssetInternal(tokenAddress), "Invalid asset");
        _;
    }

    constructor() Ownable(msg.sender) {
        creationFee = 0.01 ether; // Default creation fee

        // Enable all asset types by default
        enabledAssetTypes[IDataTypes.AssetType.GOLD] = true;
        enabledAssetTypes[IDataTypes.AssetType.SILVER] = true;
        enabledAssetTypes[IDataTypes.AssetType.REAL_ESTATE] = true;
        enabledAssetTypes[IDataTypes.AssetType.ART] = true;
        enabledAssetTypes[IDataTypes.AssetType.OIL] = true;
        enabledAssetTypes[IDataTypes.AssetType.CUSTOM] = true;
    }

    /**
     * @notice Create a new RWA token
     * @param name Token name
     * @param symbol Token symbol
     * @param assetType Type of asset
     * @param initialSupply Initial token supply
     * @param pricePerToken Price per token in wei
     * @return Address of the created token
     */
    function createAsset(
        string memory name,
        string memory symbol,
        IDataTypes.AssetType assetType,
        uint256 initialSupply,
        uint256 pricePerToken
    )
        external
        payable
        nonReentrant
        whenNotPaused
        onlyAuthorizedCreator
        validAssetType(assetType)
        returns (address)
    {
        require(msg.value >= creationFee, "Insufficient creation fee");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(initialSupply > 0, "Initial supply must be greater than 0");
        require(pricePerToken > 0, "Price per token must be greater than 0");

        // Create new RWA token
        RWAToken newToken = new RWAToken(
            name,
            symbol,
            assetType,
            initialSupply,
            pricePerToken,
            msg.sender,
            address(this)
        );

        address tokenAddress = address(newToken);

        // Store asset information
        assets[tokenAddress] = IDataTypes.AssetInfo({
            name: name,
            symbol: symbol,
            assetType: assetType,
            totalSupply: initialSupply,
            pricePerToken: pricePerToken,
            tokenAddress: tokenAddress,
            isActive: true,
            createdAt: block.timestamp,
            creator: msg.sender
        });

        // Add to tracking arrays
        allAssets.push(tokenAddress);
        assetsByType[assetType].push(tokenAddress);

        emit AssetCreated(tokenAddress, name, symbol, assetType, msg.sender);

        // Refund excess payment
        if (msg.value > creationFee) {
            payable(msg.sender).transfer(msg.value - creationFee);
        }

        return tokenAddress;
    }

    /**
     * @notice Update asset price
     * @param tokenAddress Address of the token
     * @param newPrice New price per token
     */
    function updateAssetPrice(
        address tokenAddress,
        uint256 newPrice
    ) external override onlyOwner validAsset(tokenAddress) {
        require(newPrice > 0, "Price must be greater than 0");

        assets[tokenAddress].pricePerToken = newPrice;
        RWAToken(tokenAddress).updatePrice(newPrice);

        emit AssetUpdated(tokenAddress, newPrice, block.timestamp);
    }

    /**
     * @notice Deactivate an asset
     * @param tokenAddress Address of the token to deactivate
     */
    function deactivateAsset(
        address tokenAddress
    ) external override onlyOwner validAsset(tokenAddress) {
        assets[tokenAddress].isActive = false;
        RWAToken(tokenAddress).deactivate();

        emit AssetDeactivated(tokenAddress);
    }

    /**
     * @notice Get asset information
     * @param tokenAddress Address of the token
     * @return Asset information
     */
    function getAssetInfo(
        address tokenAddress
    ) external view override returns (IDataTypes.AssetInfo memory) {
        require(_isValidAssetInternal(tokenAddress), "Invalid asset");
        return assets[tokenAddress];
    }

    /**
     * @notice Get all assets
     * @return Array of all asset addresses
     */
    function getAllAssets() external view override returns (address[] memory) {
        return allAssets;
    }

    /**
     * @notice Get assets by type
     * @param assetType Type of assets to retrieve
     * @return Array of asset addresses
     */
    function getAssetsByType(
        IDataTypes.AssetType assetType
    ) external view override returns (address[] memory) {
        return assetsByType[assetType];
    }
    
    /**
     * @notice Check if an asset is valid
     * @param tokenAddress Address of the token to check
     * @return True if the asset is valid and active
     */
    function isValidAsset(address tokenAddress) external view override returns (bool) {
        return _isValidAssetInternal(tokenAddress);
    }
    
    /**
     * @notice Internal function to check if an asset is valid
     * @param tokenAddress Address of the token to check
     * @return True if the asset is valid and active
     */
    function _isValidAssetInternal(address tokenAddress) internal view returns (bool) {
        if (tokenAddress == address(0)) return false;
        return assets[tokenAddress].isActive && assets[tokenAddress].tokenAddress != address(0);
    }

    /**
     * @notice Set creation fee
     * @param newFee New creation fee
     */
    function setCreationFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = creationFee;
        creationFee = newFee;
        emit CreationFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Authorize/deauthorize asset creator
     * @param creator Creator address
     * @param authorized Authorization status
     */
    function setCreatorAuthorization(
        address creator,
        bool authorized
    ) external onlyOwner {
        authorizedCreators[creator] = authorized;
        emit CreatorAuthorized(creator, authorized);
    }

    /**
     * @notice Enable/disable asset type
     * @param assetType Asset type to configure
     * @param enabled Enable status
     */
    function setAssetTypeEnabled(
        IDataTypes.AssetType assetType,
        bool enabled
    ) external onlyOwner {
        enabledAssetTypes[assetType] = enabled;
        emit AssetTypeEnabled(assetType, enabled);
    }

    /**
     * @notice Get active assets
     * @return Array of active asset addresses
     */
    function getActiveAssets() external view returns (address[] memory) {
        uint256 activeCount = 0;

        // Count active assets
        for (uint256 i = 0; i < allAssets.length; i++) {
            if (assets[allAssets[i]].isActive) {
                activeCount++;
            }
        }

        // Create array of active assets
        address[] memory activeAssets = new address[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allAssets.length; i++) {
            if (assets[allAssets[i]].isActive) {
                activeAssets[index] = allAssets[i];
                index++;
            }
        }

        return activeAssets;
    }

    /**
     * @notice Get total number of assets
     * @return Total asset count
     */
    function getTotalAssetCount() external view returns (uint256) {
        return allAssets.length;
    }

    /**
     * @notice Get asset count by type
     * @param assetType Asset type
     * @return Asset count for the type
     */
    function getAssetCountByType(
        IDataTypes.AssetType assetType
    ) external view returns (uint256) {
        return assetsByType[assetType].length;
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
     * @notice Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @notice Emergency function to recover stuck tokens
     * @param token Token address
     * @param amount Amount to recover
     */
    function emergencyRecoverToken(
        address token,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}
