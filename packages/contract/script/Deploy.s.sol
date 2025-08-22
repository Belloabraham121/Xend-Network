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
    address public chainlinkPriceOracle;
    address public rewardAssetFactory;
    address public portfolioManager;
    address public rewardsDistributor;
    address public lendingPool;
    address public strategyVault;
    address public assetMarketplace;
    
    // Configuration parameters
    struct DeploymentConfig {
        address feeRecipient;
        uint256 creationFee;
        uint256 maxAssetsPerUser;
        uint256 maxPositionsPerPortfolio;
        uint256 rewardPoolAmount;
    }
    
    function run() external {
        // Get deployment configuration
        DeploymentConfig memory config = getDeploymentConfig();
        
        // Start broadcasting transactions
        vm.startBroadcast();
        
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
    
    /**
     * @notice Deploy ChainlinkPriceOracle
     * @dev Requires: initialOwner address
     */
    function deployChainlinkPriceOracle() internal {
        console.log("Deploying ChainlinkPriceOracle...");
        
        ChainlinkPriceOracle oracle = new ChainlinkPriceOracle(
            msg.sender // initialOwner
        );
        chainlinkPriceOracle = address(oracle);
        
        console.log("ChainlinkPriceOracle deployed at:", chainlinkPriceOracle);
    }
    
    /**
     * @notice Deploy RewardAssetFactory
     * @dev Requires: No constructor parameters (uses msg.sender as owner)
     */
    function deployRewardAssetFactory(DeploymentConfig memory config) internal {
        console.log("Deploying RewardAssetFactory...");
        
        RewardAssetFactory factory = new RewardAssetFactory();
        rewardAssetFactory = address(factory);
        
        // Configure the factory after deployment
        factory.setCreationFee(config.creationFee);
        
        console.log("RewardAssetFactory deployed at:", rewardAssetFactory);
    }
    
    /**
     * @notice Deploy PortfolioManager
     * @dev Requires: assetFactory address
     */
    function deployPortfolioManager(DeploymentConfig memory config) internal {
        console.log("Deploying PortfolioManager...");
        
        PortfolioManager manager = new PortfolioManager(
            rewardAssetFactory // _assetFactory
        );
        portfolioManager = address(manager);
        
        // Configure the manager after deployment
        manager.setMaxPositionsPerUser(config.maxPositionsPerPortfolio);
        
        console.log("PortfolioManager deployed at:", portfolioManager);
    }
    
    /**
     * @notice Deploy RewardsDistributor
     * @dev Requires: portfolioManager, assetFactory, rewardToken addresses
     */
    function deployRewardsDistributor(DeploymentConfig memory config) internal {
        console.log("Deploying RewardsDistributor...");
        
        RewardsDistributor distributor = new RewardsDistributor(
            portfolioManager,    // _portfolioManager
            rewardAssetFactory, // _assetFactory
            address(0)          // _rewardToken (using native token for rewards)
        );
        rewardsDistributor = address(distributor);
        
        // Fund the rewards pool if specified
        if (config.rewardPoolAmount > 0) {
            // Note: This would require the deployer to have sufficient balance
            // payable(rewardsDistributor).transfer(config.rewardPoolAmount);
            console.log("Warning: Reward pool funding skipped. Fund manually if needed.");
        }
        
        console.log("RewardsDistributor deployed at:", rewardsDistributor);
    }
    
    /**
     * @notice Deploy LendingPool
     * @dev Requires: priceOracle, assetFactory, initialOwner addresses
     */
    function deployLendingPool() internal {
        console.log("Deploying LendingPool...");
        
        LendingPool pool = new LendingPool(
            chainlinkPriceOracle, // _priceOracle
            rewardAssetFactory,   // _assetFactory
            msg.sender            // initialOwner
        );
        lendingPool = address(pool);
        
        console.log("LendingPool deployed at:", lendingPool);
    }
    
    /**
     * @notice Deploy StrategyVault
     * @dev Requires: priceOracle, assetFactory, portfolioManager addresses
     */
    function deployStrategyVault() internal {
        console.log("Deploying StrategyVault...");
        
        StrategyVault vault = new StrategyVault(
            chainlinkPriceOracle, // _priceOracle
            rewardAssetFactory,   // _assetFactory
            portfolioManager      // _portfolioManager
        );
        strategyVault = address(vault);
        
        console.log("StrategyVault deployed at:", strategyVault);
    }
    
    /**
     * @notice Deploy AssetMarketplace
     * @dev Requires: priceOracle, assetFactory, feeRecipient addresses
     */
    function deployAssetMarketplace(DeploymentConfig memory config) internal {
        console.log("Deploying AssetMarketplace...");
        
        AssetMarketplace marketplace = new AssetMarketplace(
            chainlinkPriceOracle, // _priceOracle
            rewardAssetFactory,   // _assetFactory
            config.feeRecipient   // _feeRecipient
        );
        assetMarketplace = address(marketplace);
        
        console.log("AssetMarketplace deployed at:", assetMarketplace);
    }
    
    /**
     * @notice Configure contracts after deployment
     */
    function configureContracts(DeploymentConfig memory config) internal {
        console.log("Configuring contracts...");
        
        // Configure RewardAssetFactory
        RewardAssetFactory(rewardAssetFactory).setCreatorAuthorization(msg.sender, true);
        
        // Note: Additional configuration can be added here as needed
        // For example, setting up initial price feeds in the oracle,
        // configuring lending pool parameters, etc.
        
        console.log("Contract configuration completed");
    }
    
    /**
     * @notice Get deployment configuration from environment or defaults
     */
    function getDeploymentConfig() internal view returns (DeploymentConfig memory) {
        // Use deployer as fee recipient by default, can be changed later
        address feeRecipient = msg.sender;
        uint256 creationFee = 0.01 ether;           // Default 0.01 ETH
        uint256 maxAssetsPerUser = 50;              // Default 50 assets per user
        uint256 maxPositionsPerPortfolio = 20;      // Default 20 positions per portfolio
        uint256 rewardPoolAmount = 0;               // Default 0 - no initial funding
        
        // Try to read from environment variables if available
        try vm.envAddress("FEE_RECIPIENT") returns (address envFeeRecipient) {
            feeRecipient = envFeeRecipient;
        } catch {}
        
        try vm.envUint("CREATION_FEE") returns (uint256 envCreationFee) {
            creationFee = envCreationFee;
        } catch {}
        
        try vm.envUint("MAX_ASSETS_PER_USER") returns (uint256 envMaxAssets) {
            maxAssetsPerUser = envMaxAssets;
        } catch {}
        
        try vm.envUint("MAX_POSITIONS_PER_PORTFOLIO") returns (uint256 envMaxPositions) {
            maxPositionsPerPortfolio = envMaxPositions;
        } catch {}
        
        try vm.envUint("REWARD_POOL_AMOUNT") returns (uint256 envRewardPool) {
            rewardPoolAmount = envRewardPool;
        } catch {}
        
        return DeploymentConfig({
            feeRecipient: feeRecipient,
            creationFee: creationFee,
            maxAssetsPerUser: maxAssetsPerUser,
            maxPositionsPerPortfolio: maxPositionsPerPortfolio,
            rewardPoolAmount: rewardPoolAmount
        });
    }
    
    /**
     * @notice Log deployment addresses
     */
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
        
        // Output deployment addresses in JSON format for easy parsing
        console.log("\n=== JSON FORMAT ===");
        console.log("{");
        console.log('  "chainlinkPriceOracle":', '"', chainlinkPriceOracle, '",');
        console.log('  "rewardAssetFactory":', '"', rewardAssetFactory, '",');
        console.log('  "portfolioManager":', '"', portfolioManager, '",');
        console.log('  "rewardsDistributor":', '"', rewardsDistributor, '",');
        console.log('  "lendingPool":', '"', lendingPool, '",');
        console.log('  "strategyVault":', '"', strategyVault, '",');
        console.log('  "assetMarketplace":', '"', assetMarketplace, '"');
        console.log("}");
        console.log("==================\n");
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
