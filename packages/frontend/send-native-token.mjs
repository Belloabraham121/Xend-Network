import { ethers } from "ethers";

// Configuration - Multiple RPC endpoints for reliability
const MANTLE_TESTNET_RPCS = [
  "https://rpc.sepolia.mantle.xyz",
  "https://mantle-sepolia.g.alchemy.com/v2/cpenwKf_vUc59UKfsx5FUumCtZ_bSU_W",
  "https://rpc.testnet.mantle.xyz"
];

// Private key and recipient address from user input
const PRIVATE_KEY = "0x22502bfb065825cdfd268c2a9810d7fc78c46786b53f18c370c8229b26149bff";
const RECIPIENT_ADDRESS = "0xeeD71459493CDda2d97fBefbd459701e356593f3";

// Amount to send (you can modify this value)
const AMOUNT_TO_SEND = "0.01"; // 0.01 MNT

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

async function sendNativeToken() {
  try {
    console.log("🚀 Starting native token transfer...");
    console.log("Network: Mantle Testnet");
    console.log("Recipient:", RECIPIENT_ADDRESS);
    console.log("Amount:", AMOUNT_TO_SEND, "MNT");
    console.log("=".repeat(50));

    // Create provider with retry logic
    const provider = await createProvider();
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log("📍 Sender address:", wallet.address);
    
    // Check sender balance
    const balance = await provider.getBalance(wallet.address);
    const balanceInMNT = ethers.formatEther(balance);
    console.log("💰 Current balance:", balanceInMNT, "MNT");
    
    // Check if we have enough balance
    const amountInWei = ethers.parseEther(AMOUNT_TO_SEND);
    if (balance < amountInWei) {
      throw new Error(`Insufficient balance. Need ${AMOUNT_TO_SEND} MNT but only have ${balanceInMNT} MNT`);
    }
    
    // Get current gas price
    const gasPrice = await provider.getFeeData();
    console.log("⛽ Gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
    
    // Estimate gas for the transaction
    const gasEstimate = await provider.estimateGas({
      to: RECIPIENT_ADDRESS,
      value: amountInWei,
      from: wallet.address
    });
    
    // Add 20% buffer to gas estimate
    const gasLimit = gasEstimate + (gasEstimate * 20n / 100n);
    console.log("⛽ Estimated gas:", gasEstimate.toString());
    console.log("⛽ Gas limit (with buffer):", gasLimit.toString());
    
    // Prepare transaction
    const transaction = {
      to: RECIPIENT_ADDRESS,
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
      const newRecipientBalance = await provider.getBalance(RECIPIENT_ADDRESS);
      
      console.log("\n💰 Updated balances:");
      console.log("  Sender:", ethers.formatEther(newSenderBalance), "MNT");
      console.log("  Recipient:", ethers.formatEther(newRecipientBalance), "MNT");
      
    } else {
      console.log("❌ Transaction failed!");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log("💡 Tip: Make sure your wallet has enough MNT for the transaction and gas fees.");
    } else if (error.code === 'NETWORK_ERROR') {
      console.log("💡 Tip: Check your internet connection and RPC endpoint.");
    }
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  sendNativeToken();
}

export { sendNativeToken };