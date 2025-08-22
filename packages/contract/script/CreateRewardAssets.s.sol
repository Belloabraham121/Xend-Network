// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/core/RewardAssetFactory.sol";
import "../src/interfaces/IDataTypes.sol";

/**
 * @title CreateRewardAssets
 * @notice Foundry script to create reward asset tokens using RewardAssetFactory
 * @dev Run with: forge script script/CreateRewardAssets.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
 */
contract CreateRewardAssets is Script {
    // Contract addresses (update these with your deployed addresses)
    address constant REWARD_ASSET_FACTORY =
        0xae4e89df546994BDe296Bc2cc2D949961cB7A123;

    // Asset creation parameters
    struct AssetParams {
        string name;
        string symbol;
        IDataTypes.AssetType assetType;
        uint256 initialSupply;
        uint256 pricePerToken; // in wei
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Creating reward assets with deployer:", deployer);
        console.log("RewardAssetFactory address:", REWARD_ASSET_FACTORY);

        vm.startBroadcast(deployerPrivateKey);

        RewardAssetFactory factory = RewardAssetFactory(REWARD_ASSET_FACTORY);

        // Check creation fee
        uint256 creationFee = factory.creationFee();
        console.log("Creation fee:", creationFee);

        // Create multiple reward assets
        createGoldAsset(factory, creationFee);
        createRealEstateAsset(factory, creationFee);
        createArtAsset(factory, creationFee);
        createCustomAsset(factory, creationFee);

        vm.stopBroadcast();

        console.log("All reward assets created successfully!");
    }

    function createGoldAsset(
        RewardAssetFactory factory,
        uint256 creationFee
    ) internal {
        console.log("\n=== Creating Gold Asset ===");

        AssetParams memory params = AssetParams({
            name: "Gold Reserve Token",
            symbol: "GOLD",
            assetType: IDataTypes.AssetType.GOLD,
            initialSupply: 1000000 * 10 ** 18, // 1M tokens
            pricePerToken: 0.0001 ether // 0.001 ETH per token
        });

        address goldToken = factory.createAsset{value: creationFee}(
            params.name,
            params.symbol,
            params.assetType,
            params.initialSupply,
            params.pricePerToken
        );

        console.log("Gold token created at:", goldToken);
        console.log("Name:", params.name);
        console.log("Symbol:", params.symbol);
        console.log("Initial Supply:", params.initialSupply);
        console.log("Price per token:", params.pricePerToken);
    }

    function createRealEstateAsset(
        RewardAssetFactory factory,
        uint256 creationFee
    ) internal {
        console.log("\n=== Creating Real Estate Asset ===");

        AssetParams memory params = AssetParams({
            name: "Premium Real Estate Fund",
            symbol: "PREF",
            assetType: IDataTypes.AssetType.REAL_ESTATE,
            initialSupply: 500000 * 10 ** 18, // 500K tokens
            pricePerToken: 0.0009 ether // 0.01 ETH per token
        });

        address realEstateToken = factory.createAsset{value: creationFee}(
            params.name,
            params.symbol,
            params.assetType,
            params.initialSupply,
            params.pricePerToken
        );

        console.log("Real Estate token created at:", realEstateToken);
        console.log("Name:", params.name);
        console.log("Symbol:", params.symbol);
        console.log("Initial Supply:", params.initialSupply);
        console.log("Price per token:", params.pricePerToken);
    }

    function createArtAsset(
        RewardAssetFactory factory,
        uint256 creationFee
    ) internal {
        console.log("\n=== Creating Art Asset ===");

        AssetParams memory params = AssetParams({
            name: "Digital Art Collection",
            symbol: "DART",
            assetType: IDataTypes.AssetType.ART,
            initialSupply: 100000 * 10 ** 18, // 100K tokens
            pricePerToken: 0.00005 ether // 0.005 ETH per token
        });

        address artToken = factory.createAsset{value: creationFee}(
            params.name,
            params.symbol,
            params.assetType,
            params.initialSupply,
            params.pricePerToken
        );

        console.log("Art token created at:", artToken);
        console.log("Name:", params.name);
        console.log("Symbol:", params.symbol);
        console.log("Initial Supply:", params.initialSupply);
        console.log("Price per token:", params.pricePerToken);
    }

    function createCustomAsset(
        RewardAssetFactory factory,
        uint256 creationFee
    ) internal {
        console.log("\n=== Creating Custom Asset ===");

        AssetParams memory params = AssetParams({
            name: "Renewable Energy Credits",
            symbol: "REC",
            assetType: IDataTypes.AssetType.CUSTOM,
            initialSupply: 2000000 * 10 ** 18, // 2M tokens
            pricePerToken: 0.0005 ether // 0.0005 ETH per token
        });

        address customToken = factory.createAsset{value: creationFee}(
            params.name,
            params.symbol,
            params.assetType,
            params.initialSupply,
            params.pricePerToken
        );

        console.log("Custom token created at:", customToken);
        console.log("Name:", params.name);
        console.log("Symbol:", params.symbol);
        console.log("Initial Supply:", params.initialSupply);
        console.log("Price per token:", params.pricePerToken);
    }

    /**
     * @notice Create a single asset with custom parameters
     * @dev This function can be called individually for creating specific assets
     */
    function createSingleAsset(
        string memory name,
        string memory symbol,
        IDataTypes.AssetType assetType,
        uint256 initialSupply,
        uint256 pricePerToken
    ) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        RewardAssetFactory factory = RewardAssetFactory(REWARD_ASSET_FACTORY);
        uint256 creationFee = factory.creationFee();

        address newToken = factory.createAsset{value: creationFee}(
            name,
            symbol,
            assetType,
            initialSupply,
            pricePerToken
        );

        vm.stopBroadcast();

        console.log("\n=== Single Asset Created ===");
        console.log("Token address:", newToken);
        console.log("Name:", name);
        console.log("Symbol:", symbol);
        console.log("Asset Type:", uint8(assetType));
        console.log("Initial Supply:", initialSupply);
        console.log("Price per token:", pricePerToken);
    }

    /**
     * @notice Get information about created assets
     */
    function getAssetInfo() external view {
        RewardAssetFactory factory = RewardAssetFactory(REWARD_ASSET_FACTORY);

        uint256 totalAssets = factory.getTotalAssetCount();
        console.log("\n=== Asset Information ===");
        console.log("Total assets created:", totalAssets);

        // Get active assets
        address[] memory activeAssets = factory.getActiveAssets();
        console.log("Active assets count:", activeAssets.length);

        for (uint256 i = 0; i < activeAssets.length && i < 10; i++) {
            address assetAddr = activeAssets[i];
            console.log("Asset", i + 1, "address:", assetAddr);
        }
    }
}
