// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/core/PortfolioManager.sol";
import "../src/core/RewardAssetFactory.sol";

/**
 * @title DeployPortfolioManager
 * @notice Deployment script for PortfolioManager contract
 */
contract DeployPortfolioManager is Script {
    // Deployment configuration
    struct PortfolioManagerConfig {
        address assetFactory;
        uint256 maxPositionsPerUser;
        uint256 minPositionValue;
        bool shouldPause;
    }

    // Deployed contract address
    address public portfolioManager;

    function run() external {
        // Get deployment configuration
        PortfolioManagerConfig memory config = getDeploymentConfig();

        // Validate configuration
        require(
            config.assetFactory != address(0),
            "Asset factory address required"
        );

        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions with private key
        vm.startBroadcast(deployerPrivateKey);

        // Deploy PortfolioManager
        deployPortfolioManager(config);

        // Configure the contract
        configurePortfolioManager(config);

        vm.stopBroadcast();

        // Log deployment information
        logDeploymentInfo(config);
    }

    /**
     * @notice Deploy PortfolioManager contract
     * @param config Deployment configuration
     */
    function deployPortfolioManager(
        PortfolioManagerConfig memory config
    ) internal {
        console.log("Deploying PortfolioManager...");
        console.log("Asset Factory:", config.assetFactory);

        PortfolioManager manager = new PortfolioManager(config.assetFactory);

        portfolioManager = address(manager);

        console.log("PortfolioManager deployed at:", portfolioManager);
    }

    /**
     * @notice Configure PortfolioManager after deployment
     * @param config Deployment configuration
     */
    function configurePortfolioManager(
        PortfolioManagerConfig memory config
    ) internal {
        console.log("Configuring PortfolioManager...");

        PortfolioManager manager = PortfolioManager(portfolioManager);

        // Set maximum positions per user if specified
        if (config.maxPositionsPerUser > 0) {
            manager.setMaxPositionsPerUser(config.maxPositionsPerUser);
            console.log(
                "Max positions per user set to:",
                config.maxPositionsPerUser
            );
        }

        // Set minimum position value if specified
        if (config.minPositionValue > 0) {
            manager.setMinPositionValue(config.minPositionValue);
            console.log("Min position value set to:", config.minPositionValue);
        }

        // Pause contract if requested
        if (config.shouldPause) {
            manager.pause();
            console.log("PortfolioManager paused");
        }

        console.log("PortfolioManager configuration completed");
    }

    /**
     * @notice Get deployment configuration based on network
     * @return config Deployment configuration
     */
    function getDeploymentConfig()
        public
        returns (PortfolioManagerConfig memory config)
    {
        uint256 chainId = block.chainid;

        if (chainId == 5003) {
            // Mantle Sepolia Testnet
            config = PortfolioManagerConfig({
                assetFactory: getAssetFactoryAddress(),
                maxPositionsPerUser: 20,
                minPositionValue: 0.001 ether,
                shouldPause: false
            });
        } else if (chainId == 5000) {
            // Mantle Mainnet
            config = PortfolioManagerConfig({
                assetFactory: getAssetFactoryAddress(),
                maxPositionsPerUser: 50,
                minPositionValue: 0.01 ether,
                shouldPause: false
            });
        } else if (chainId == 31337) {
            // Local development (Anvil)
            config = PortfolioManagerConfig({
                assetFactory: getAssetFactoryAddress(),
                maxPositionsPerUser: 10,
                minPositionValue: 0.0001 ether,
                shouldPause: false
            });
        } else {
            // Default configuration for unknown networks
            config = PortfolioManagerConfig({
                assetFactory: getAssetFactoryAddress(),
                maxPositionsPerUser: 20,
                minPositionValue: 0.001 ether,
                shouldPause: false
            });
        }
    }

    /**
     * @notice Get RewardAssetFactory address
     * @dev This function returns the deployed factory address based on network
     * @return factoryAddress The asset factory address
     */
    function getAssetFactoryAddress() public returns (address factoryAddress) {
        // Try to get from environment variable first
        try vm.envAddress("ASSET_FACTORY_ADDRESS") returns (
            address envAddress
        ) {
            if (envAddress != address(0)) {
                return envAddress;
            }
        } catch {
            // Environment variable not set, continue to network-specific logic
        }

        uint256 chainId = block.chainid;

        if (chainId == 5003) {
            // Mantle Sepolia Testnet - Use deployed factory address
            return 0xae4e89df546994BDe296Bc2cc2D949961cB7A123;
        } else if (chainId == 31337) {
            // Local Anvil network - Use placeholder address for testing
            return 0x1234567890123456789012345678901234567890;
        } else if (chainId == 5000) {
            // Mantle Mainnet
            revert(
                "Mainnet deployment requires ASSET_FACTORY_ADDRESS environment variable"
            );
        } else {
            // Unknown network
            revert(
                "Unsupported network. Please set ASSET_FACTORY_ADDRESS environment variable"
            );
        }
    }

    /**
     * @notice Log deployment information
     * @param config Deployment configuration used
     */
    function logDeploymentInfo(PortfolioManagerConfig memory config) internal {
        console.log("\n=== PortfolioManager Deployment Summary ===");
        console.log("Network Chain ID:", block.chainid);
        console.log("Deployer:", msg.sender);
        console.log("PortfolioManager:", portfolioManager);
        console.log("Asset Factory:", config.assetFactory);
        console.log("Max Positions Per User:", config.maxPositionsPerUser);
        console.log("Min Position Value:", config.minPositionValue);
        console.log("Contract Paused:", config.shouldPause);
        console.log("\n=== Next Steps ===");
        console.log("1. Verify the contract on block explorer");
        console.log("2. Update frontend configuration with new address");
        console.log("3. Test portfolio creation and management functions");
        console.log("4. Configure asset type risk weights if needed");

        // Save deployment info to file for frontend integration
        string memory deploymentInfo = string.concat(
            '{"portfolioManager":"',
            vm.toString(portfolioManager),
            '","assetFactory":"',
            vm.toString(config.assetFactory),
            '","chainId":',
            vm.toString(block.chainid),
            ',"deployedAt":',
            vm.toString(block.timestamp),
            "}"
        );

        console.log("\nDeployment JSON:");
        console.log(deploymentInfo);
        console.log(
            "\nNote: Copy the above JSON to ./deployments/portfolio-manager.json for frontend integration"
        );
    }

    /**
     * @notice Deploy with custom asset factory address
     * @param assetFactoryAddress Custom asset factory address
     */
    function deployWithCustomFactory(address assetFactoryAddress) external {
        require(
            assetFactoryAddress != address(0),
            "Invalid asset factory address"
        );

        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        PortfolioManagerConfig memory config = PortfolioManagerConfig({
            assetFactory: assetFactoryAddress,
            maxPositionsPerUser: 20,
            minPositionValue: 0.001 ether,
            shouldPause: false
        });

        deployPortfolioManager(config);
        configurePortfolioManager(config);

        vm.stopBroadcast();

        logDeploymentInfo(config);
    }

    /**
     * @notice Deploy for testing with minimal configuration
     */
    function deployForTesting() external {
        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy a mock asset factory for testing
        RewardAssetFactory mockFactory = new RewardAssetFactory();

        PortfolioManagerConfig memory config = PortfolioManagerConfig({
            assetFactory: address(mockFactory),
            maxPositionsPerUser: 5,
            minPositionValue: 0.0001 ether,
            shouldPause: false
        });

        deployPortfolioManager(config);
        configurePortfolioManager(config);

        vm.stopBroadcast();

        console.log("\n=== Testing Deployment Complete ===");
        console.log("Mock Asset Factory:", address(mockFactory));
        console.log("PortfolioManager:", portfolioManager);
    }
}
