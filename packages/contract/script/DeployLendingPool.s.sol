// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/core/LendingPool.sol";

contract DeployLendingPool is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying LendingPool with the account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        // Use already deployed contract addresses
        address priceOracle = 0x8F1e22C51544dc4D66571d64f6DD01cb426d651F;
        address assetFactory = 0xae4e89df546994BDe296Bc2cc2D949961cB7A123;
        
        console.log("Using existing ChainlinkPriceOracle:", priceOracle);
        console.log("Using existing RewardAssetFactory:", assetFactory);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy LendingPool
        LendingPool lendingPool = new LendingPool(
            priceOracle,
            assetFactory,
            deployer
        );
        console.log("LendingPool deployed to:", address(lendingPool));
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("ChainlinkPriceOracle:", priceOracle);
        console.log("RewardAssetFactory:", assetFactory);
        console.log("LendingPool:", address(lendingPool));
        console.log("Owner:", deployer);
    }
}
