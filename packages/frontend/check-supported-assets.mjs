import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MANTLE_TESTNET_RPC =
  "https://mantle-sepolia.g.alchemy.com/v2/cpenwKf_vUc59UKfsx5FUumCtZ_bSU_W";
const LENDING_POOL_ADDRESS = "0xFeE2CC90da44D83A4C1426d67EdD0F3b03d0204e";

// Load ABI
const lendingPoolABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, "src/lib/abis/LendingPool.json"), "utf8")
);

// Common test token addresses on Mantle Testnet
const TEST_TOKENS = [
  "0xd3871a7653073f2c8e4ed9d8d798303586a44f55", // Gold Reserve Token
  "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE", // USDT
  "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9", // USDC
  "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", // WETH
  "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8", // WMNT
];

async function checkSupportedAssets() {
  try {
    console.log("🔍 Checking supported assets in LendingPool...");
    console.log(`📍 LendingPool: ${LENDING_POOL_ADDRESS}`);
    console.log("\n" + "=".repeat(60));

    // Setup provider
    const provider = new ethers.JsonRpcProvider(MANTLE_TESTNET_RPC);
    
    // Setup contract
    const lendingPool = new ethers.Contract(
      LENDING_POOL_ADDRESS,
      lendingPoolABI,
      provider
    );

    console.log("\n🪙 Checking individual token support:");
    
    for (const tokenAddress of TEST_TOKENS) {
      try {
        const isSupported = await lendingPool.supportedAssets(tokenAddress);
        const status = isSupported ? "✅ SUPPORTED" : "❌ NOT SUPPORTED";
        console.log(`${status} - ${tokenAddress}`);
        
        if (isSupported) {
          console.log(`   👆 This token can be used for testing!`);
        }
      } catch (error) {
        console.log(`⚠️ ERROR checking ${tokenAddress}: ${error.message}`);
      }
    }

    // Try to get the reserves list
    console.log("\n📋 Attempting to get reserves list...");
    try {
      const reservesList = await lendingPool.getReservesList();
      console.log(`✅ Found ${reservesList.length} reserves:`);
      reservesList.forEach((reserve, index) => {
        console.log(`   ${index + 1}. ${reserve}`);
      });
    } catch (error) {
      console.log(`⚠️ Could not get reserves list: ${error.message}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("💡 Use any SUPPORTED token address in your deposit test!");
    
  } catch (error) {
    console.error("❌ Error checking supported assets:");
    console.error(error);
  }
}

// Run the check
if (import.meta.url === `file://${process.argv[1]}`) {
  checkSupportedAssets();
}

export { checkSupportedAssets };