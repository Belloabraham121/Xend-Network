# LendingPool Deposit Test Script

This Node.js script allows you to test deposits directly to the LendingPool contract, bypassing the frontend to debug gas limit issues.

## Setup

1. **Install dependencies:**
   ```bash
   npm install ethers
   ```

2. **Set your private key:**
   ```bash
   export PRIVATE_KEY="your_private_key_here"
   ```
   
   Or edit the script directly (line 16) - **NOT recommended for production**

3. **Verify contract addresses:**
   - LendingPool: `0xFeE2CC90da44D83A4C1426d67EdD0F3b03d0204e`
   - Gold Reserve Token: `0xd3871a7653073f2c8e4ed9d8d798303586a44f55`

## Usage

```bash
node deposit-test.mjs
```

## What the script does:

1. **Connects to Mantle Testnet** using the RPC endpoint
2. **Checks your wallet balance** (ETH and tokens)
3. **Approves tokens** for the LendingPool contract (if needed)
4. **Estimates gas** for the deposit transaction
5. **Executes the deposit** with a 50% gas buffer
6. **Reports the results** including gas used

## Configuration

You can modify these values in the script:

- `LENDING_POOL_ADDRESS`: The LendingPool contract address
- `GOLD_RESERVE_TOKEN`: The token contract address to deposit
- `depositAmount`: Currently set to 0.1 tokens (line 58)
- `gasPrice`: Currently set to 20 gwei (lines 70, 105)

## Troubleshooting

### "Gas limit is too low" error:
- The script automatically estimates gas and adds a 50% buffer
- If estimation fails, it uses a fallback of 3,000,000 gas
- Check if the contract is paused or has restrictions

### "Insufficient funds" error:
- Ensure you have enough ETH for gas fees
- Ensure you have enough tokens to deposit

### "Invalid private key" error:
- Make sure your private key is set correctly
- Private key should start with '0x'

### Contract interaction errors:
- Verify the contract addresses are correct
- Check if you're connected to the right network (Mantle Testnet)
- Ensure the LendingPool contract is deployed and functional

## Network Details

- **Network**: Mantle Testnet
- **Chain ID**: 5003
- **RPC URL**: https://rpc.sepolia.mantle.xyz
- **Explorer**: https://explorer.sepolia.mantle.xyz

## Security Notes

- Never commit private keys to version control
- Use environment variables for sensitive data
- This script is for testing purposes only
- Always verify contract addresses before sending transactions

## Example Output

```
🚀 Starting LendingPool deposit test...
📍 Wallet address: 0x1234...
🏦 LendingPool address: 0xFeE2CC90da44D83A4C1426d67EdD0F3b03d0204e
🪙 Token address: 0xd3871a7653073f2c8e4ed9d8d798303586a44f55
📊 Token: GOLD, Decimals: 18
💰 Wallet ETH balance: 0.5 ETH
🪙 Token balance: 10.0 GOLD
📥 Deposit amount: 0.1 GOLD
✅ Current allowance: 0.0 GOLD

🔐 Step 1: Approving tokens...
📝 Approval tx hash: 0xabc123...
✅ Approval confirmed!

💰 Step 2: Depositing tokens...
⛽ Estimated gas: 250000
⛽ Using gas limit: 375000
📝 Deposit tx hash: 0xdef456...
⏳ Waiting for confirmation...
✅ Deposit confirmed! Block: 1234567
⛽ Gas used: 245000

🎉 Deposit test completed successfully!
```