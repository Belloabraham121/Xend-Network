// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/core/RewardAssetFactory.sol";
import "../src/interfaces/IDataTypes.sol";

/**
 * @title GetAssetInfo Script
 * @dev Script to demonstrate usage of the getAssetInfo function from RewardAssetFactory
 * @notice This script fetches and displays asset information for deployed RWA tokens
 */
contract GetAssetInfo is Script {
    // RewardAssetFactory contract address (update with your deployed address)
    address constant REWARD_ASSET_FACTORY =
        0xae4e89df546994BDe296Bc2cc2D949961cB7A123;

    // Known asset addresses from CreateRewardAssets deployment
    address constant GOLD_TOKEN = 0xd3871a7653073f2C8e4ED9D8D798303586A44F55;
    address constant REAL_ESTATE_TOKEN =
        0xaD95399B7DDDF51145e7FD5735c865e474C5c010;
    address constant ART_TOKEN = 0x91755aeE9e26355AEA0B102e48a46d0918490d4F;
    address constant ENERGY_TOKEN = 0xF7Be754c0EfEA6E0CDD5a511770996Af4769E6D6;

    RewardAssetFactory factory;

    function setUp() public {
        factory = RewardAssetFactory(REWARD_ASSET_FACTORY);
    }

    /**
     * @dev Main function to get asset information for all known assets
     */
    function run() public view {
        console.log("=== RewardAssetFactory Asset Information ===");
        console.log("Factory Address:", REWARD_ASSET_FACTORY);
        console.log("");

        // Get info for all known assets
        getAssetInfoForToken(GOLD_TOKEN, "Gold Reserve Token");
        getAssetInfoForToken(REAL_ESTATE_TOKEN, "Premium Real Estate Fund");
        getAssetInfoForToken(ART_TOKEN, "Art Fund");
        getAssetInfoForToken(ENERGY_TOKEN, "Renewable Energy Credits");
    }

    /**
     * @dev Get asset information for a specific token address
     * @param tokenAddress The address of the RWA token
     * @param description Human-readable description for logging
     */
    function getAssetInfoForToken(
        address tokenAddress,
        string memory description
    ) public view {
        console.log("--- Asset Info for", description, "---");
        console.log("Token Address:", tokenAddress);

        try factory.getAssetInfo(tokenAddress) returns (
            IDataTypes.AssetInfo memory assetInfo
        ) {
            console.log("[SUCCESS] Asset found in factory");
            console.log("Name:", assetInfo.name);
            console.log("Symbol:", assetInfo.symbol);
            console.log("Asset Type:", uint256(assetInfo.assetType));
            console.log("Creator:", assetInfo.creator);
            console.log("Total Supply:", assetInfo.totalSupply);
            console.log("Price Per Token:", assetInfo.pricePerToken);
            console.log("Created At:", assetInfo.createdAt);
            console.log("Is Active:", assetInfo.isActive);

            // Convert asset type enum to string
            string memory assetTypeStr = getAssetTypeString(
                assetInfo.assetType
            );
            console.log("Asset Type (String):", assetTypeStr);
        } catch Error(string memory reason) {
            console.log("[ERROR] Error getting asset info:", reason);
        } catch {
            console.log("[ERROR] Unknown error getting asset info");
        }

        console.log("");
    }

    /**
     * @dev Get asset information for a single token (can be called individually)
     * @param tokenAddress The address of the RWA token to query
     */
    function getSingleAssetInfo(
        address tokenAddress
    ) public view returns (IDataTypes.AssetInfo memory) {
        return factory.getAssetInfo(tokenAddress);
    }

    /**
     * @dev Check if an asset is valid in the factory
     * @param tokenAddress The address to check
     */
    function checkAssetRegistration(address tokenAddress) public view {
        console.log("Checking registration for:", tokenAddress);

        try factory.getAssetInfo(tokenAddress) returns (
            IDataTypes.AssetInfo memory
        ) {
            console.log("Is Valid: true");
        } catch {
            console.log("Is Valid: false");
        }
    }

    /**
     * @dev Get total number of assets in the factory
     */
    function getTotalAssetCount() public view {
        console.log(
            "Note: getTotalAssetCount function may not be available in factory"
        );
    }

    /**
     * @dev Convert AssetType enum to human-readable string
     * @param assetType The asset type enum value
     */
    function getAssetTypeString(
        IDataTypes.AssetType assetType
    ) internal pure returns (string memory) {
        if (assetType == IDataTypes.AssetType.GOLD) return "Gold";
        if (assetType == IDataTypes.AssetType.SILVER) return "Silver";
        if (assetType == IDataTypes.AssetType.REAL_ESTATE) return "Real Estate";
        if (assetType == IDataTypes.AssetType.ART) return "Art";
        if (assetType == IDataTypes.AssetType.OIL) return "Oil";
        if (assetType == IDataTypes.AssetType.CUSTOM) return "Custom";
        return "Unknown";
    }

    /**
     * @dev Comprehensive asset analysis
     */
    function runComprehensiveAnalysis() public view {
        console.log("=== Comprehensive Asset Analysis ===");

        // Get total count
        getTotalAssetCount();
        console.log("");

        // Check each asset registration
        console.log("--- Registration Status ---");
        checkAssetRegistration(GOLD_TOKEN);
        checkAssetRegistration(REAL_ESTATE_TOKEN);
        checkAssetRegistration(ART_TOKEN);
        checkAssetRegistration(ENERGY_TOKEN);
        console.log("");

        // Get detailed info for each asset
        run();
    }
}
