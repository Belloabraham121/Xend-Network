// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

/**
 * @title DeployConfig
 * @notice Configuration contract for network-specific deployment parameters
 */
contract DeployConfig is Script {
    struct NetworkConfig {
        string name;
        uint256 chainId;
        address linkToken;
        address functionsRouter;
        bytes32 donId;
        uint64 subscriptionId;
        uint32 gasLimit;
        uint256 creationFee;
        uint256 tradingFee;
        uint256 maxAssetsPerUser;
        uint256 maxPositionsPerPortfolio;
        uint256 rewardPoolAmount;
    }
    
    // Network configurations
    function getMantleTestnetConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            name: "Mantle Sepolia Testnet",
            chainId: 5003,
            linkToken: 0x6D0F8D488B669aa9BA2D0f0b7B75a88bf5051CD3,
            functionsRouter: 0xC22a79eBA640940ABB6dF0f7982cc119578E11De,
            donId: 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000,
            subscriptionId: 0, // To be set after subscription creation
            gasLimit: 300000,
            creationFee: 0.01 ether,
            tradingFee: 250, // 2.5%
            maxAssetsPerUser: 50,
            maxPositionsPerPortfolio: 20,
            rewardPoolAmount: 10 ether
        });
    }
    
    function getMantleMainnetConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            name: "Mantle Mainnet",
            chainId: 5000,
            linkToken: address(0), // To be updated when available
            functionsRouter: address(0), // To be updated when available
            donId: bytes32(0), // To be updated when available
            subscriptionId: 0, // To be set after subscription creation
            gasLimit: 300000,
            creationFee: 0.1 ether,
            tradingFee: 250, // 2.5%
            maxAssetsPerUser: 100,
            maxPositionsPerPortfolio: 50,
            rewardPoolAmount: 100 ether
        });
    }
    
    function getLocalConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            name: "Local Development",
            chainId: 31337,
            linkToken: address(0), // Mock address for local testing
            functionsRouter: address(0), // Mock address for local testing
            donId: bytes32(0), // Mock for local testing
            subscriptionId: 0,
            gasLimit: 300000,
            creationFee: 0.001 ether,
            tradingFee: 100, // 1%
            maxAssetsPerUser: 10,
            maxPositionsPerPortfolio: 5,
            rewardPoolAmount: 1 ether
        });
    }
    
    function getConfigForChainId(uint256 chainId) public pure returns (NetworkConfig memory) {
        if (chainId == 5003) {
            return getMantleTestnetConfig();
        } else if (chainId == 5000) {
            return getMantleMainnetConfig();
        } else if (chainId == 31337) {
            return getLocalConfig();
        } else {
            revert("Unsupported chain ID");
        }
    }
    
    function getCurrentNetworkConfig() public view returns (NetworkConfig memory) {
        return getConfigForChainId(block.chainid);
    }
    
    // Asset type configurations for initial setup
    function getInitialAssetTypes() public pure returns (string[] memory, uint256[] memory) {
        string[] memory assetTypes = new string[](5);
        uint256[] memory initialPrices = new uint256[](5);
        
        assetTypes[0] = "Real Estate";
        assetTypes[1] = "Commodities";
        assetTypes[2] = "Art & Collectibles";
        assetTypes[3] = "Infrastructure";
        assetTypes[4] = "Private Equity";
        
        // Initial prices in USD (scaled by 1e8 for Chainlink compatibility)
        initialPrices[0] = 100000 * 1e8; // $100,000
        initialPrices[1] = 50000 * 1e8;  // $50,000
        initialPrices[2] = 25000 * 1e8;  // $25,000
        initialPrices[3] = 200000 * 1e8; // $200,000
        initialPrices[4] = 75000 * 1e8;  // $75,000
        
        return (assetTypes, initialPrices);
    }
    
    // Risk parameters for different asset types
    function getRiskParameters() public pure returns (uint256[] memory, uint256[] memory) {
        uint256[] memory collateralRatios = new uint256[](5);
        uint256[] memory liquidationThresholds = new uint256[](5);
        
        // Collateral ratios (basis points, 10000 = 100%)
        collateralRatios[0] = 7500; // 75% for Real Estate
        collateralRatios[1] = 8000; // 80% for Commodities
        collateralRatios[2] = 6000; // 60% for Art & Collectibles
        collateralRatios[3] = 8500; // 85% for Infrastructure
        collateralRatios[4] = 7000; // 70% for Private Equity
        
        // Liquidation thresholds (basis points)
        liquidationThresholds[0] = 8500; // 85% for Real Estate
        liquidationThresholds[1] = 9000; // 90% for Commodities
        liquidationThresholds[2] = 7500; // 75% for Art & Collectibles
        liquidationThresholds[3] = 9500; // 95% for Infrastructure
        liquidationThresholds[4] = 8000; // 80% for Private Equity
        
        return (collateralRatios, liquidationThresholds);
    }
    
    // Interest rate model parameters
    function getInterestRateParameters() public pure returns (
        uint256 baseRate,
        uint256 multiplier,
        uint256 jumpMultiplier,
        uint256 kink
    ) {
        baseRate = 2e16; // 2% base rate
        multiplier = 10e16; // 10% multiplier
        jumpMultiplier = 100e16; // 100% jump multiplier
        kink = 80e16; // 80% utilization kink
    }
    
    // Strategy vault parameters
    function getStrategyParameters() public pure returns (
        uint256 managementFee,
        uint256 performanceFee,
        uint256 rebalanceThreshold,
        uint256 rebalanceInterval
    ) {
        managementFee = 200; // 2% management fee
        performanceFee = 2000; // 20% performance fee
        rebalanceThreshold = 500; // 5% threshold
        rebalanceInterval = 7 days; // Weekly rebalancing
    }
}