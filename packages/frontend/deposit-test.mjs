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
// Available test tokens (use any of these that are supported by the LendingPool)
const AVAILABLE_TOKENS = {
  GOLD: {
    address: "0xd3871a7653073f2c8e4ed9d8d798303586a44f55",
    name: "Gold Reserve Token (GOLD)"
  },
  PREF: {
    address: "0xad95399b7dddf51145e7fd5735c865e474c5c010",
    name: "Premium Real Estate Fund (PREF)"
  },
  ART: {
    address: "0x91755aee9e26355aea0b102e48a46d0918490d4f",
    name: "Art Fund"
  },
  REC: {
    address: "0xf7be754c0efea6e0cdd5a511770996af4769e6d6",
    name: "Renewable Energy Credits (REC)"
  }
};

// Select which token to test (change this to test different tokens)
const SELECTED_TOKEN = AVAILABLE_TOKENS.GOLD; // Change to PREF, ART, or REC as needed
const TEST_TOKEN = SELECTED_TOKEN.address;

// You need to set your private key here (use environment variable in production)
const PRIVATE_KEY = process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE";

// Load ABI
const lendingPoolABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, "src/lib/abis/LendingPool.json"), "utf8")
);

// ERC20 ABI for token operations
const erc20ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
];

async function testDeposit() {
  try {
    console.log("🚀 Starting LendingPool deposit test...");

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(MANTLE_TESTNET_RPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`📍 Wallet address: ${wallet.address}`);
    console.log(`🏦 LendingPool address: ${LENDING_POOL_ADDRESS}`);
    console.log(`🪙 Testing with: ${SELECTED_TOKEN.name}`);
    console.log(`🪙 Token address: ${TEST_TOKEN}`);

    // Create contract instances
    const lendingPool = new ethers.Contract(
      LENDING_POOL_ADDRESS,
      lendingPoolABI,
      wallet
    );
    const token = new ethers.Contract(TEST_TOKEN, erc20ABI, wallet);

    // Check if asset is supported
    console.log("🔍 Checking if asset is supported...");
    try {
      const isSupported = await lendingPool.supportedAssets(TEST_TOKEN);
      console.log(`✅ Asset supported: ${isSupported}`);
      
      if (!isSupported) {
        console.log("❌ Asset is not supported by the LendingPool contract!");
        console.log("💡 You need to use a supported asset or add this asset to the pool first.");
        return;
      }
    } catch (error) {
      console.log("⚠️ Could not check asset support, proceeding anyway...");
    }

    // Get token info
    const tokenSymbol = await token.symbol();
    const tokenDecimals = await token.decimals();
    console.log(`📊 Token: ${tokenSymbol}, Decimals: ${tokenDecimals}`);

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Wallet ETH balance: ${ethers.formatEther(balance)} ETH`);

    // Check token balance
    const tokenBalance = await token.balanceOf(wallet.address);
    console.log(
      `🪙 Token balance: ${ethers.formatUnits(
        tokenBalance,
        tokenDecimals
      )} ${tokenSymbol}`
    );

    // Deposit amount (0.1 tokens)
    const depositAmount = ethers.parseUnits("0.1", tokenDecimals);
    console.log(
      `📥 Deposit amount: ${ethers.formatUnits(
        depositAmount,
        tokenDecimals
      )} ${tokenSymbol}`
    );

    // Check current allowance
    const currentAllowance = await token.allowance(
      wallet.address,
      LENDING_POOL_ADDRESS
    );
    console.log(
      `✅ Current allowance: ${ethers.formatUnits(
        currentAllowance,
        tokenDecimals
      )} ${tokenSymbol}`
    );

    // Step 1: Approve tokens if needed
    if (currentAllowance < depositAmount) {
      console.log("\n🔐 Step 1: Approving tokens...");

      const approveTx = await token.approve(
        LENDING_POOL_ADDRESS,
        depositAmount,
        {
          gasLimit: 100000, // Standard gas limit for ERC20 approval
          gasPrice: ethers.parseUnits("20", "gwei"),
        }
      );

      console.log(`📝 Approval tx hash: ${approveTx.hash}`);
      await approveTx.wait();
      console.log("✅ Approval confirmed!");
    } else {
      console.log("✅ Sufficient allowance already exists");
    }

    // Step 2: Deposit tokens
    console.log("\n💰 Step 2: Depositing tokens...");

    // Estimate gas for deposit
    let gasEstimate;
    try {
      gasEstimate = await lendingPool.deposit.estimateGas(
        TEST_TOKEN,
        depositAmount
      );
      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
    } catch (error) {
      console.log(`⚠️ Gas estimation failed: ${error.message}`);
      gasEstimate = 85000000; // Fallback to very high gas limit (85M+)
    }

    // Use high gas limit as indicated by error message
    const gasLimit = BigInt(Math.max(Number(gasEstimate), 85000000));
    console.log(`⛽ Using gas limit: ${gasLimit.toString()}`);

    const depositTx = await lendingPool.deposit(
      TEST_TOKEN,
      depositAmount,
      {
        gasLimit: gasLimit,
        gasPrice: ethers.parseUnits("20", "gwei"),
      }
    );

    console.log(`📝 Deposit tx hash: ${depositTx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await depositTx.wait();
    console.log(`✅ Deposit confirmed! Block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

    console.log("\n🎉 Deposit test completed successfully!");
  } catch (error) {
    console.error("❌ Error during deposit test:");
    console.error(error);

    if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
      console.log("\n💡 Suggestions:");
      console.log("1. Check if the contract address is correct");
      console.log("2. Ensure you have sufficient token balance");
      console.log("3. Verify the token is approved for the LendingPool");
      console.log(
        "4. Check if the LendingPool contract is paused or has restrictions"
      );
    }
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testDeposit();
}

export { testDeposit };
