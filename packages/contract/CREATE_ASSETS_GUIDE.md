# Create Reward Assets Script Guide

This guide explains how to use the `CreateRewardAssets.s.sol` Foundry script to create reward asset tokens using the RewardAssetFactory contract.

## Prerequisites

1. **Environment Setup**: Ensure you have a `.env` file with your private key:
   ```
   PRIVATE_KEY=your_private_key_here
   ```

2. **Contract Deployment**: Make sure the RewardAssetFactory contract is deployed and you have the correct address.

3. **Authorization**: Your account must be authorized to create assets (either be the owner or an authorized creator).

4. **Funds**: Ensure your account has enough ETH to pay for:
   - Creation fees (default: 0.01 ETH per asset)
   - Gas fees for transactions

## Usage

### 1. Create Multiple Sample Assets

To create all sample assets (Gold, Real Estate, Art, and Custom):

```bash
# For Mantle Testnet
forge script script/CreateRewardAssets.s.sol:CreateRewardAssets --rpc-url https://rpc.testnet.mantle.xyz --broadcast --verify

# For local development
forge script script/CreateRewardAssets.s.sol:CreateRewardAssets --rpc-url http://localhost:8545 --broadcast
```

### 2. Create a Single Custom Asset

To create a single asset with custom parameters, you can modify the script or use the `createSingleAsset` function:

```bash
# Example: Create a Silver asset
forge script script/CreateRewardAssets.s.sol:CreateRewardAssets --sig "createSingleAsset(string,string,uint8,uint256,uint256)" "Silver Bullion Token" "SILVER" 1 "1000000000000000000000000" "2000000000000000" --rpc-url https://rpc.testnet.mantle.xyz --broadcast
```

### 3. Check Asset Information

To view information about created assets:

```bash
forge script script/CreateRewardAssets.s.sol:CreateRewardAssets --sig "getAssetInfo()" --rpc-url https://rpc.testnet.mantle.xyz
```

## Asset Types

The script supports the following asset types:

- `GOLD` (0): Gold-backed tokens
- `SILVER` (1): Silver-backed tokens  
- `REAL_ESTATE` (2): Real estate-backed tokens
- `ART` (3): Art-backed tokens
- `OIL` (4): Oil-backed tokens
- `CUSTOM` (5): Custom asset types

## Sample Assets Created

The script creates these sample assets:

1. **Gold Reserve Token (GOLD)**
   - Supply: 1,000,000 tokens
   - Price: 0.001 ETH per token
   - Type: GOLD

2. **Premium Real Estate Fund (PREF)**
   - Supply: 500,000 tokens
   - Price: 0.01 ETH per token
   - Type: REAL_ESTATE

3. **Digital Art Collection (DART)**
   - Supply: 100,000 tokens
   - Price: 0.005 ETH per token
   - Type: ART

4. **Renewable Energy Credits (REC)**
   - Supply: 2,000,000 tokens
   - Price: 0.0005 ETH per token
   - Type: CUSTOM

## Customization

### Update Contract Address

Before running the script, update the `REWARD_ASSET_FACTORY` constant with your deployed contract address:

```solidity
address constant REWARD_ASSET_FACTORY = 0xYourContractAddressHere;
```

### Modify Asset Parameters

You can modify the asset parameters in each creation function:

```solidity
AssetParams memory params = AssetParams({
    name: "Your Asset Name",
    symbol: "SYMBOL",
    assetType: IDataTypes.AssetType.GOLD, // Choose appropriate type
    initialSupply: 1000000 * 10**18, // Amount in wei
    pricePerToken: 0.001 ether // Price in wei
});
```

## Troubleshooting

### Common Issues

1. **"Not authorized to create assets"**
   - Solution: Ensure your account is authorized by the contract owner

2. **"Insufficient creation fee"**
   - Solution: Check the current creation fee and ensure you have enough ETH

3. **"Asset type not enabled"**
   - Solution: Verify that the asset type is enabled in the factory contract

4. **Gas estimation failed**
   - Solution: Increase gas limit or check if the contract is paused

### Verification

After creating assets, you can verify them on the blockchain explorer or by calling the factory's view functions:

- `getTotalAssetCount()`: Get total number of assets
- `getActiveAssets()`: Get list of active asset addresses
- `assets(address)`: Get detailed information about a specific asset

## Security Notes

- Never commit your private key to version control
- Use environment variables for sensitive data
- Test on testnet before mainnet deployment
- Verify contract addresses before running scripts
- Keep your private key secure and use hardware wallets for production