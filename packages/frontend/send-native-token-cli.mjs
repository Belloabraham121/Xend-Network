import { ethers } from "ethers";

// Configuration - Multiple RPC endpoints for reliability
const MANTLE_TESTNET_RPCS = [
  "https://rpc.sepolia.mantle.xyz",
  "https://mantle-sepolia.g.alchemy.com/v2/cpenwKf_vUc59UKfsx5FUumCtZ_bSU_W",
  "https://rpc.testnet.mantle.xyz"
];

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    privateKey: "0x22502bfb065825cdfd268c2a9810d7fc78c46786b53f18c370c8229b26149bff",
    recipient: "0xeeD71459493CDda2d97fBefbd459701e356593f3",
    amount: "0.01"
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--private-key':
      case '-p':
        config.privateKey = args[++i];
        break;
      case '--recipient':
      case '-r':
        config.recipient = args[++i];
        break;
      case '--amount':
      case '-a':
        config.amount = args[++i];
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        showHelp();
        process.exit(1);
    }
  }

  return config;
}

function showHelp() {
  console.log(`
🚀 Native Token Transfer Script for Mantle Testnet

Usage: node send-native-token-cli.mjs [options]

Options:
  -p, --private-key <key>     Private key of sender wallet
  -r, --recipient <address>   Recipient wallet address
  -a, --amount <amount>       Amount to send in MNT (e.g., 0.01)
  -h, --help                  Show this help message

Examples:
  # Use default values
  node send-native-token-cli.mjs
  
  # Send 0.05 MNT to a specific address
  node send-native-token-cli.mjs -a 0.05 -r 0x1234567890123456789012345678901234567890
  
  # Use a different private key
  node send-native-token-cli.mjs -p 0xabcdef... -r 0x1234... -a 0.1

Default values:
  Private Key: 0x22502bfb065825cdfd268c2a9810d7fc78c46786b53f18c370c8229b26149bff
  Recipient:   0xeeD71459493CDda2d97fBefbd459701e356593f3
  Amount:      0.01 MNT

⚠️  Security Warning: Never use real private keys in production scripts!
`);
}

async function createProvider() {
  for (const rpc of MANTLE_TESTNET_RPCS) {
    try {
      console.log(`🔗 Trying RPC: ${rpc}`);
      const provider = new ethers.JsonRpcProvider(rpc);
      // Test the connection
      await provider.getNetwork();
      console.log(`✅ Connected to RPC: ${rpc}`);
      return provider;
    } catch (error) {
      console.log(`❌ Failed to connect to ${rpc}: ${error.message}`);
      continue;
    }
  }
  throw new Error("All RPC endpoints failed");
}

async function sendNativeToken(config) {
  try {
    console.log("🚀 Starting native token transfer...");
    console.log("Network: Mantle Testnet");
    console.log("Recipient:", config.recipient);
    console.log("Amount:", config.amount, "MNT");
    console.log("=".repeat(50));

    // Validate inputs
    if (!ethers.isAddress(config.recipient)) {
      throw new Error(`Invalid recipient address: ${config.recipient}`);
    }
    
    if (!config.privateKey.startsWith('0x') || config.privateKey.length !== 66) {
      throw new Error("Invalid private key format");
    }
    
    const amountInWei = ethers.parseEther(config.amount);
    if (amountInWei <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Create provider with retry logic
    const provider = await createProvider();
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(config.privateKey, provider);
    
    console.log("📍 Sender address:", wallet.address);
    
    // Check sender balance
    const balance = await provider.getBalance(wallet.address);
    const balanceInMNT = ethers.formatEther(balance);
    console.log("💰 Current balance:", balanceInMNT, "MNT");
    
    // Check if we have enough balance
    if (balance < amountInWei) {
      throw new Error(`Insufficient balance. Need ${config.amount} MNT but only have ${balanceInMNT} MNT`);
    }
    
    // Get current gas price
    const gasPrice = await provider.getFeeData();
    console.log("⛽ Gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
    
    // Estimate gas for the transaction
    const gasEstimate = await provider.estimateGas({
      to: config.recipient,
      value: amountInWei,
      from: wallet.address
    });
    
    // Add 20% buffer to gas estimate
    const gasLimit = gasEstimate + (gasEstimate * 20n / 100n);
    console.log("⛽ Estimated gas:", gasEstimate.toString());
    console.log("⛽ Gas limit (with buffer):", gasLimit.toString());
    
    // Prepare transaction
    const transaction = {
      to: config.recipient,
      value: amountInWei,
      gasLimit: gasLimit,
      gasPrice: gasPrice.gasPrice
    };
    
    console.log("📋 Transaction details:");
    console.log("  To:", transaction.to);
    console.log("  Value:", ethers.formatEther(transaction.value), "MNT");
    console.log("  Gas Limit:", transaction.gasLimit.toString());
    console.log("  Gas Price:", ethers.formatUnits(transaction.gasPrice, "gwei"), "gwei");
    
    // Calculate total cost
    const gasCost = BigInt(transaction.gasLimit) * transaction.gasPrice;
    const totalCost = transaction.value + gasCost;
    console.log("💸 Estimated gas cost:", ethers.formatEther(gasCost), "MNT");
    console.log("💸 Total cost:", ethers.formatEther(totalCost), "MNT");
    
    // Check if we have enough for total cost
    if (balance < totalCost) {
      throw new Error(`Insufficient balance for total cost. Need ${ethers.formatEther(totalCost)} MNT but only have ${balanceInMNT} MNT`);
    }
    
    // Send transaction
    console.log("\n🔄 Sending transaction...");
    const txResponse = await wallet.sendTransaction(transaction);
    console.log("✅ Transaction sent!");
    console.log("📄 Transaction hash:", txResponse.hash);
    console.log("🔗 Explorer link: https://explorer.sepolia.mantle.xyz/tx/" + txResponse.hash);
    
    // Wait for confirmation
    console.log("\n⏳ Waiting for confirmation...");
    const receipt = await txResponse.wait();
    
    if (receipt.status === 1) {
      console.log("🎉 Transaction confirmed!");
      console.log("📦 Block number:", receipt.blockNumber);
      console.log("⛽ Gas used:", receipt.gasUsed.toString());
      
      // Check new balances
      const newSenderBalance = await provider.getBalance(wallet.address);
      const newRecipientBalance = await provider.getBalance(config.recipient);
      
      console.log("\n💰 Updated balances:");
      console.log("  Sender:", ethers.formatEther(newSenderBalance), "MNT");
      console.log("  Recipient:", ethers.formatEther(newRecipientBalance), "MNT");
      
      return {
        success: true,
        txHash: txResponse.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } else {
      console.log("❌ Transaction failed!");
      return { success: false, error: "Transaction failed" };
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log("💡 Tip: Make sure your wallet has enough MNT for the transaction and gas fees.");
    } else if (error.code === 'NETWORK_ERROR') {
      console.log("💡 Tip: Check your internet connection and RPC endpoint.");
    } else if (error.message.includes('Invalid')) {
      console.log("💡 Tip: Check your input parameters (addresses, private key, amount).");
    }
    
    return { success: false, error: error.message };
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = parseArgs();
  sendNativeToken(config);
}

export { sendNativeToken };