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
// Multiple test tokens to add as supported assets
const TEST_TOKENS = [
  {
    address: "0xd3871a7653073f2c8e4ed9d8d798303586a44f55",
    name: "Gold Reserve Token (GOLD)"
  },
  {
    address: "0xad95399b7dddf51145e7fd5735c865e474c5c010",
    name: "Premium Real Estate Fund (PREF)"
  },
  {
    address: "0x91755aee9e26355aea0b102e48a46d0918490d4f",
    name: "Art Fund"
  },
  {
    address: "0xf7be754c0efea6e0cdd5a511770996af4769e6d6",
    name: "Renewable Energy Credits (REC)"
  }
];

// You need to set your private key here (use environment variable in production)
const PRIVATE_KEY = process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE";

// Load ABI
const lendingPoolABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, "src/lib/abis/LendingPool.json"), "utf8")
);

async function addTestAsset() {
  try {
    console.log("🚀 Adding multiple test assets to LendingPool...");
    console.log(`📍 LendingPool: ${LENDING_POOL_ADDRESS}`);
    console.log(`🪙 Tokens to add: ${TEST_TOKENS.length}`);
    TEST_TOKENS.forEach((token, index) => {
      console.log(`   ${index + 1}. ${token.name}: ${token.address}`);
    });

    if (PRIVATE_KEY === "YOUR_PRIVATE_KEY_HERE") {
      console.log("❌ Please set your PRIVATE_KEY environment variable!");
      console.log("💡 Run: export PRIVATE_KEY=your_private_key_here");
      return;
    }

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(MANTLE_TESTNET_RPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`👤 Wallet: ${wallet.address}`);

    // Setup contract
    const lendingPool = new ethers.Contract(
      LENDING_POOL_ADDRESS,
      lendingPoolABI,
      wallet
    );

    // Check current support status for all tokens
    console.log("🔍 Checking current asset support status...");
    const supportStatus = [];
    for (const token of TEST_TOKENS) {
      const isSupported = await lendingPool.supportedAssets(token.address);
      supportStatus.push({ ...token, isSupported });
      console.log(`${token.name}: ${isSupported ? '✅ Already supported' : '❌ Not supported'}`);
    }
    
    const tokensToAdd = supportStatus.filter(token => !token.isSupported);
    if (tokensToAdd.length === 0) {
      console.log("✅ All assets are already supported!");
      return;
    }
    
    console.log(`📝 Need to add ${tokensToAdd.length} assets`);

    // Check if we're the owner
    console.log("👑 Checking contract ownership...");
    try {
      const owner = await lendingPool.owner();
      console.log(`Contract owner: ${owner}`);
      console.log(`Your address: ${wallet.address}`);
      
      if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
        console.log("❌ You are not the contract owner!");
        console.log("💡 Only the contract owner can add new assets.");
        console.log(`💡 Contract owner is: ${owner}`);
        return;
      }
    } catch (error) {
      console.log("⚠️ Could not check ownership, proceeding anyway...");
    }

    // Add each asset
    console.log("💰 Adding assets to LendingPool...");
    
    // Parameters for addAsset:
    // - asset: token address
    // - collateralFactor: 80% (8000 basis points, assuming 10000 = 100%)
    // - baseRate: 5% annual (500 basis points)
    const collateralFactor = ethers.parseUnits("8000", 0); // 80%
    const baseRate = ethers.parseUnits("500", 0); // 5%
    
    console.log(`📊 Collateral Factor: ${collateralFactor} (80%)`);
    console.log(`📈 Base Rate: ${baseRate} (5%)`);

    let successCount = 0;
    let failureCount = 0;

    for (const token of tokensToAdd) {
      try {
        console.log(`\n🔄 Adding ${token.name}...`);
        
        // Estimate gas first
        const gasEstimate = await lendingPool.addAsset.estimateGas(
          token.address,
          collateralFactor,
          baseRate
        );
        console.log(`⛽ Estimated gas: ${gasEstimate}`);
        
        const addAssetTx = await lendingPool.addAsset(
          token.address,
          collateralFactor,
          baseRate,
          {
            gasLimit: BigInt(Math.floor(Number(gasEstimate) * 1.5)), // 50% buffer
            gasPrice: ethers.parseUnits("20", "gwei")
          }
        );
        
        console.log(`📝 Transaction hash: ${addAssetTx.hash}`);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await addAssetTx.wait();
        console.log(`✅ ${token.name} added successfully! Block: ${receipt.blockNumber}`);
        
        // Verify the asset was added
        const isNowSupported = await lendingPool.supportedAssets(token.address);
        console.log(`🔍 Verification - ${token.name} supported: ${isNowSupported}`);
        
        if (isNowSupported) {
          successCount++;
        }
        
      } catch (error) {
        console.log(`❌ Error adding ${token.name}: ${error.message}`);
        failureCount++;
        
        if (error.message.includes("OwnableUnauthorizedAccount")) {
          console.log("💡 This error means you're not the contract owner.");
        } else if (error.message.includes("Asset already exists")) {
          console.log("💡 This asset might already be added.");
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully added: ${successCount} assets`);
    console.log(`❌ Failed to add: ${failureCount} assets`);
    
    if (successCount > 0) {
      console.log("🎉 Success! You can now use these tokens for deposits.");
      console.log("💡 Run the deposit test script: node deposit-test.mjs");
    }
    
  } catch (error) {
    console.error("❌ Error in addTestAsset:");
    console.error(error);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  addTestAsset();
}

export { addTestAsset };