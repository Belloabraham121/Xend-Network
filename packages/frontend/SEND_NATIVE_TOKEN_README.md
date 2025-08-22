# Native Token Transfer Script

This script allows you to send native MNT tokens on Mantle Testnet using a private key.

## Features

- ✅ **Multi-RPC Support**: Automatically tries multiple RPC endpoints for reliability
- ✅ **Dynamic Gas Estimation**: Automatically estimates and adjusts gas limits
- ✅ **Balance Checking**: Verifies sufficient balance before sending
- ✅ **Transaction Monitoring**: Waits for confirmation and shows updated balances
- ✅ **Error Handling**: Comprehensive error handling with helpful tips
- ✅ **Explorer Links**: Provides direct links to view transactions on Mantle Explorer

## Usage

### Basic Script

The basic script (`send-native-token.mjs`) uses hardcoded values:

```bash
node send-native-token.mjs
```

### CLI Script (Recommended)

The CLI script (`send-native-token-cli.mjs`) accepts command line arguments for flexibility:

```bash
# Use default values
node send-native-token-cli.mjs

# Send custom amount
node send-native-token-cli.mjs -a 0.05

# Send to different recipient
node send-native-token-cli.mjs -r 0x1234567890123456789012345678901234567890 -a 0.1

# Use different private key
node send-native-token-cli.mjs -p 0xabcdef... -r 0x1234... -a 0.1

# Show help
node send-native-token-cli.mjs --help
```

### Configuration

The script is pre-configured with:
- **Private Key**: `0x22502bfb065825cdfd268c2a9810d7fc78c46786b53f18c370c8229b26149bff`
- **Recipient**: `0xeeD71459493CDda2d97fBefbd459701e356593f3`
- **Amount**: `0.01 MNT`

### CLI Options

The CLI script supports the following options:

- `-p, --private-key <key>`: Private key of sender wallet
- `-r, --recipient <address>`: Recipient wallet address  
- `-a, --amount <amount>`: Amount to send in MNT
- `-h, --help`: Show help message

### Customizing the Basic Script

For the basic script, edit these variables:

```javascript
const PRIVATE_KEY = "your_private_key_here";
const RECIPIENT_ADDRESS = "recipient_address_here";
const AMOUNT_TO_SEND = "0.05"; // Send 0.05 MNT instead
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Private Key Security**: The private key is hardcoded in the script. In production:
   - Use environment variables: `process.env.PRIVATE_KEY`
   - Never commit private keys to version control
   - Consider using hardware wallets or secure key management

2. **Testnet Only**: This script is configured for Mantle Testnet. Do not use on mainnet without proper security measures.

## Example Output

```
🚀 Starting native token transfer...
Network: Mantle Testnet
Recipient: 0xeeD71459493CDda2d97fBefbd459701e356593f3
Amount: 0.01 MNT
==================================================
🔗 Trying RPC: https://rpc.sepolia.mantle.xyz
✅ Connected to RPC: https://rpc.sepolia.mantle.xyz
📍 Sender address: 0xE977B29af0a7bc5464B76cEAb68E13E89cA050eA
💰 Current balance: 498.702313557753160655 MNT
⛽ Gas price: 0.0201 gwei
⛽ Estimated gas: 95600618
⛽ Gas limit (with buffer): 114720741
📋 Transaction details:
  To: 0xeeD71459493CDda2d97fBefbd459701e356593f3
  Value: 0.01 MNT
  Gas Limit: 114720741
  Gas Price: 0.0201 gwei
💸 Estimated gas cost: 0.0023058868941 MNT
💸 Total cost: 0.0123058868941 MNT

🔄 Sending transaction...
✅ Transaction sent!
📄 Transaction hash: 0x27f9a6e763c5be96e0b5e59c410e1050b48ea94d8f437041e917349719f286b7
🔗 Explorer link: https://explorer.sepolia.mantle.xyz/tx/0x27f9a6e763c5be96e0b5e59c410e1050b48ea94d8f437041e917349719f286b7

⏳ Waiting for confirmation...
🎉 Transaction confirmed!
📦 Block number: 27178047
⛽ Gas used: 79036212

💰 Updated balances:
  Sender: 498.690724929891960655 MNT
  Recipient: 3.065457294136134834 MNT
```

## Troubleshooting

### Common Issues

1. **Insufficient Funds**
   - Ensure the sender wallet has enough MNT for both the transfer amount and gas fees
   - Gas costs on Mantle can be higher than Ethereum mainnet

2. **Network Errors**
   - The script tries multiple RPC endpoints automatically
   - Check your internet connection if all RPCs fail

3. **Gas Estimation Failures**
   - The script automatically estimates gas with a 20% buffer
   - If estimation fails, the transaction may be invalid

### Getting Test MNT

To get test MNT for Mantle Testnet:
1. Visit the [Mantle Testnet Faucet](https://faucet.testnet.mantle.xyz/)
2. Enter your wallet address
3. Request test tokens

## Dependencies

- `ethers`: ^6.10.0 (for blockchain interactions)
- Node.js (ES modules support)

## Network Information

- **Network**: Mantle Testnet
- **Chain ID**: 5003
- **Native Token**: MNT
- **Explorer**: https://explorer.sepolia.mantle.xyz
- **RPC Endpoints**:
  - https://rpc.sepolia.mantle.xyz
  - https://mantle-sepolia.g.alchemy.com/v2/cpenwKf_vUc59UKfsx5FUumCtZ_bSU_W
  - https://rpc.testnet.mantle.xyz