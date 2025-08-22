// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDataTypes.sol";

/**
 * @title IRewardAssetFactory
 * @notice Interface for the Reward Asset Factory contract
 */
interface IRewardAssetFactory {
    // Events
    event AssetCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        IDataTypes.AssetType assetType,
        address indexed creator
    );
    
    event AssetUpdated(
        address indexed tokenAddress,
        uint256 newPrice,
        uint256 timestamp
    );
    
    event AssetDeactivated(address indexed tokenAddress);
    
    // Functions
    function createAsset(
        string memory name,
        string memory symbol,
        IDataTypes.AssetType assetType,
        uint256 initialSupply,
        uint256 pricePerToken
    ) external payable returns (address);
    
    function updateAssetPrice(
        address tokenAddress,
        uint256 newPrice
    ) external;
    
    function deactivateAsset(address tokenAddress) external;
    
    function getAssetInfo(address tokenAddress) 
        external 
        view 
        returns (IDataTypes.AssetInfo memory);
    
    function getAllAssets() 
        external 
        view 
        returns (address[] memory);
    
    function getAssetsByType(IDataTypes.AssetType assetType) 
        external 
        view 
        returns (address[] memory);
    
    function isValidAsset(address tokenAddress) 
        external 
        view 
        returns (bool);
}