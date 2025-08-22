// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/tokens/RWAToken.sol";
import "../src/core/RewardAssetFactory.sol";
import "../src/core/PortfolioManager.sol";
import "../src/chainlink/ChainlinkPriceOracle.sol";
import "../src/core/RewardsDistributor.sol";
import "../src/core/LendingPool.sol";
import "../src/core/StrategyVault.sol";
import "../src/core/AssetMarketplace.sol";

/**
 * @title Deploy
 * @notice Deployment script for all RWA platform contracts
 */
contract Deploy is Script {
    // Deployment addresses will be stored here
    address public rewardAssetFactory;
    address public portfolioManager;
    address public chainlinkPriceOracle;
    address public rewardsDistributor;
    address public lendingPool;
    address public strategyVault;
    address public assetMarketplace;
    
    // Configuration parameters
    struct DeploymentConfig {
        address deployer;
        address feeRecipient;
        uint256 creationFee;
        uint256 maxAssetsPerUser;
        uint256 maxPositionsPerPortfolio;
        uint256 rewardPoolAmount;
    }
    
    function run() external {
        // Get deployment configuration
        DeploymentConfig memory config = getDeploymentConfig();
        
        vm.startBroadcast(config.deployer);
        
        // Deploy contracts in dependency order
        deployChainlinkPriceOracle();
        deployRewardAssetFactory(config);
        deployPortfolioManager(config);
        deployRewardsDistributor(config);
        deployLendingPool();
        deployStrategyVault();
        deployAssetMarketplace(config);
        
        // Configure contracts
        configureContracts(config);
        
        vm.stopBroadcast();
        
        // Log deployment addresses
        logDeploymentAddresses();
    }
    
    function deployChainlinkPriceOracle() internal {
        console.log("Deploying ChainlinkPriceOracle...");
        
        ChainlinkPriceOracle oracle = new ChainlinkPriceOracle(msg.sender);
        chainlinkPriceOracle = address(oracle);
        
        console.log("ChainlinkPriceOracle deployed at:", chainlinkPriceOracle);
    }
    
    function deployRewardAssetFactory(DeploymentConfig memory config) internal {
        console.log("Deploying RewardAssetFactory...");
        
        RewardAssetFactory factory = new RewardAssetFactory();
        rewardAssetFactory = address(factory);
        
        // Configure the factory after deployment
        factory.setCreationFee(config.creationFee);
        
        console.log("RewardAssetFactory deployed at:", rewardAssetFactory);
    }
    
    function deployPortfolioManager(DeploymentConfig memory config) internal {
        console.log("Deploying PortfolioManager...");
        
        PortfolioManager manager = new PortfolioManager(rewardAssetFactory);
        portfolioManager = address(manager);
        
        // Configure the manager after deployment
        manager.setMaxPositionsPerUser(config.maxPositionsPerPortfolio);
        
        console.log("PortfolioManager deployed at:", portfolioManager);
    }
    
    function deployRewardsDistributor(DeploymentConfig memory config) internal {
        console.log("Deploying RewardsDistributor...");
        
        RewardsDistributor distributor = new RewardsDistributor(
            portfolioManager,
            rewardAssetFactory,
            address(0) // Using native token for rewards
        );
        rewardsDistributor = address(distributor);
        
        // Fund the rewards pool if specified
        if (config.rewardPoolAmount > 0) {
            payable(rewardsDistributor).transfer(config.rewardPoolAmount);
        }
        
        console.log("RewardsDistributor deployed at:", rewardsDistributor);
    }
    
    function deployLendingPool() internal {
        console.log("Deploying LendingPool...");
        
        LendingPool pool = new LendingPool(
            chainlinkPriceOracle,
            rewardAssetFactory,
            msg.sender // initialOwner
        );
        lendingPool = address(pool);
        
        console.log("LendingPool deployed at:", lendingPool);
    }
    
    function deployStrategyVault() internal {
        console.log("Deploying StrategyVault...");
        
        StrategyVault vault = new StrategyVault(
            chainlinkPriceOracle,
            rewardAssetFactory,
            portfolioManager
        );
        strategyVault = address(vault);
        
        console.log("StrategyVault deployed at:", strategyVault);
    }
    
    function deployAssetMarketplace(DeploymentConfig memory config) internal {
        console.log("Deploying AssetMarketplace...");
        
        AssetMarketplace marketplace = new AssetMarketplace(
            chainlinkPriceOracle,
            rewardAssetFactory,
            config.feeRecipient
        );
        assetMarketplace = address(marketplace);
        
        console.log("AssetMarketplace deployed at:", assetMarketplace);
    }
    
    function configureContracts(DeploymentConfig memory config) internal {
        console.log("Configuring contracts...");
        
        // Set up basic contract configurations
        // Note: Role-based access control is not implemented in the current contracts
        // Future versions can add proper RBAC here
        
        // Configure RewardAssetFactory
        RewardAssetFactory(rewardAssetFactory).setCreatorAuthorization(msg.sender, true);
        
        console.log("Contract configuration completed");
    }
    
    function getDeploymentConfig() internal view returns (DeploymentConfig memory) {
        // Get configuration from environment variables or use defaults
        address deployer = vm.envOr("DEPLOYER_ADDRESS", msg.sender);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);
        uint256 creationFee = vm.envOr("CREATION_FEE", uint256(0.01 ether));
        uint256 maxAssetsPerUser = vm.envOr("MAX_ASSETS_PER_USER", uint256(50));
        uint256 maxPositionsPerPortfolio = vm.envOr("MAX_POSITIONS_PER_PORTFOLIO", uint256(20));
        uint256 rewardPoolAmount = vm.envOr("REWARD_POOL_AMOUNT", uint256(0));
        
        return DeploymentConfig({
            deployer: deployer,
            feeRecipient: feeRecipient,
            creationFee: creationFee,
            maxAssetsPerUser: maxAssetsPerUser,
            maxPositionsPerPortfolio: maxPositionsPerPortfolio,
            rewardPoolAmount: rewardPoolAmount
        });
    }
    
    function logDeploymentAddresses() internal view {
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("ChainlinkPriceOracle:", chainlinkPriceOracle);
        console.log("RewardAssetFactory:", rewardAssetFactory);
        console.log("PortfolioManager:", portfolioManager);
        console.log("RewardsDistributor:", rewardsDistributor);
        console.log("LendingPool:", lendingPool);
        console.log("StrategyVault:", strategyVault);
        console.log("AssetMarketplace:", assetMarketplace);
        console.log("========================\n");
    }
    
    // Helper functions for different networks
    function deployToMantle() external {
        deployAll();
    }
    
    function deployToMantleTestnet() external {
        deployAll();
    }
    
    function deployToLocal() external {
        deployAll();
    }
    
    function deployAll() internal {
        // Get default configuration
        DeploymentConfig memory config = getDeploymentConfig();
        
        deployChainlinkPriceOracle();
        deployRewardAssetFactory(config);
        deployPortfolioManager(config);
        deployRewardsDistributor(config);
        deployLendingPool();
        deployStrategyVault();
        deployAssetMarketplace(config);
        
        // Configure contracts
        configureContracts(config);
        
        // Log deployment addresses
        logDeploymentAddresses();
    }
}