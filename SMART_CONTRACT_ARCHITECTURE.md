# Xend Smart Contract Architecture
## AI-Powered RWA Financial Ecosystem

Based on your frontend analysis, here's the comprehensive smart contract system you need to implement:

## Overview

Your Xend platform is an **AI-Powered Real World Asset (RWA) Financial Ecosystem** that provides:
- RWA token creation and management
- Lending and borrowing against RWA collateral
- AMM-style swapping between RWA tokens  
- Marketplace for RWA token trading
- AI-powered insights and portfolio management
- Cross-chain bridging capabilities

## Core Contract Architecture

### 1. **XendCore** (Central Registry/Controller)
**Status:** ✅ Implemented in Hedvault repo (needs renaming)
```solidity
- Role-based access control
- Registry of all protocol contracts
- Emergency pause functionality
- User registration system
- Admin functions
```

### 2. **RWATokenFactory** (RWA Token Creation)
**Status:** ✅ Implemented in Hedvault repo
```solidity
// Key Functions Needed:
- createRWAToken(metadata) → Creates new RWA tokens
- getAllRWATokens() → Returns all created tokens  
- getAllRWATokensWithInfo() → Returns tokens with metadata
- updateTokenMetadata() → Updates RWA metadata
- pauseToken()/unpauseToken() → Emergency controls

// RWA Metadata Structure:
struct RWAMetadata {
    string assetType;      // "Real Estate", "Gold", "Art", etc.
    string location;       // Geographic location
    uint256 valuation;     // Asset valuation in USD
    address oracle;        // Price oracle address
    uint256 totalSupply;   // Total token supply
    uint256 minInvestment; // Minimum investment amount
    string certificationHash; // IPFS hash of certificates
    string additionalData; // Extra metadata
}
```

### 3. **LendingPool** (Lending & Borrowing)
**Status:** ✅ Implemented in Hedvault repo  
```solidity
// Core Functions:
- deposit(token, amount) → Supply tokens to earn yield
- withdraw(token, amount) → Withdraw supplied tokens
- createLoan(collateralToken, borrowToken, collateralAmount, borrowAmount)
- repayLoan(loanId, amount) → Repay loan
- liquidateLoan(loanId, amount) → Liquidate unhealthy loans

// View Functions:
- getPoolInfo(token) → Pool statistics
- getLoanInfo(loanId) → Loan details
- getUserLoans(user) → User's active loans
- getLoanHealthFactor(loanId) → Health ratio
- getSupplyAPY(token) → Current supply rates
- getBorrowAPY(token) → Current borrow rates
```

### 4. **SwapEngine** (AMM for RWA Tokens)
**Status:** ✅ Implemented in Hedvault repo
```solidity
// Pool Management:
- createPool(tokenA, tokenB, amountA, amountB, feeRate)
- addLiquidity(poolId, amountA, amountB, minLiquidity)  
- removeLiquidity(poolId, positionIndex, liquidity, minAmountA, minAmountB)

// Swapping:
- swap(poolId, tokenIn, amountIn, minAmountOut, maxSlippage)
- getSwapQuote(poolId, tokenIn, amountIn) → Preview swap

// Token Support:
- addSupportedToken(token) → Add token to whitelist
- isSupportedToken(token) → Check if token supported

// View Functions:
- getPoolByTokens(tokenA, tokenB) → Find pool ID
- getPool(poolId) → Pool details
- getUserPositions(user) → User's LP positions
```

### 5. **Marketplace** (P2P RWA Trading)
**Status:** ✅ Skeleton exists in Hedvault repo, needs full implementation
```solidity
// Core Trading Functions Needed:
- listToken(tokenAddress, amount, pricePerToken, duration)
- updateListing(listingId, newPrice)
- buyTokens(listingId, amount) 
- cancelListing(listingId)

// Auction Functions:
- createAuction(tokenAddress, amount, startPrice, duration)
- placeBid(auctionId, bidAmount)
- executeAuction(auctionId)

// View Functions:
- getActiveListing(listingId) → Listing details  
- getUserListings(user) → User's active listings
- getTokenListings(tokenAddress) → All listings for a token
- getMarketStats() → Trading volume, fees collected
```

### 6. **PriceOracle** (Price Feeds)
**Status:** ✅ Implemented in Hedvault repo
```solidity
// Price Management:
- updatePrice(token, price, confidence) → Update token price
- configurePriceFeed(token, chainlinkFeed, customOracle, heartbeat)
- getPrice(token) → (price, confidence, timestamp)

// RWA-specific pricing:
- updateRWAValuation(token, valuation, timestamp)
- getRWAPrice(token) → Real-world asset pricing
```

### 7. **RewardsDistributor** (Incentives System)
**Status:** ✅ Implemented in Hedvault repo
```solidity
// Reward Management:
- distributeRewards(user, amount, rewardType)
- claimRewards(user) → Claim pending rewards
- updateRewardRate(poolId, newRate)
- getRewardBalance(user) → Pending rewards
```

### 8. **CrossChainBridge** (Multi-chain Support)
**Status:** ⚠️ Basic structure exists, needs full implementation
```solidity
// Bridge Functions Needed:
- bridgeToken(token, amount, destinationChain, recipient)
- receiveToken(token, amount, sourceChain, sender)
- updateBridgeConfig(chain, bridgeAddress, isActive)

// Security:
- pauseBridge(chain) → Emergency stop
- updateMinBridgeAmount(token, amount)
- getBridgeStatus(chain) → Bridge health check
```

### 9. **PortfolioManager** (AI Integration Hub)
**Status:** ⚠️ Basic structure exists, needs AI integration
```solidity
// Portfolio Analysis:
- analyzePortfolio(user) → Returns AI insights
- getRecommendations(user) → Investment suggestions  
- calculateRiskScore(user, token) → Risk assessment
- optimizeAllocation(user, targetAllocation) → Portfolio rebalancing

// AI Integration:
- updateAIModel(modelHash) → Update AI model
- getAIInsights(user, timeframe) → Historical analysis
```

### 10. **ComplianceManager** (Regulatory Compliance)
**Status:** ✅ Implemented in Hedvault repo
```solidity
// KYC/AML Functions:
- verifyUser(user, complianceLevel)
- updateComplianceStatus(user, status)
- checkTransactionCompliance(from, to, token, amount)
- blockUser(user, reason) → Compliance violation
```

## Missing Contract Implementations

Based on your frontend, you need these additional contracts:

### 11. **RWAOffchainOracle** (Real-World Asset Pricing)
**Status:** ⚠️ Needs full implementation
```solidity
// External Price Integration:
- updateAssetPrice(tokenAddress, price, source, timestamp)
- getLatestPrice(tokenAddress) → Most recent price
- configurePriceSources(tokenAddress, sources[], weights[])
- validatePriceSource(source) → Authorize price providers

// Price Aggregation:
- aggregatePrice(tokenAddress) → Weighted average price
- getPriceHistory(tokenAddress, timeframe) → Historical data
```

### 12. **AIInsightsOracle** (AI-Powered Analytics)
**Status:** 🔴 Needs implementation
```solidity
// AI Model Integration:
- submitAIInsight(user, insightType, data, confidence)
- getAIRecommendation(user, assetClass) → Investment advice
- updateMarketSentiment(assetType, sentiment, confidence)
- getPortfolioOptimization(user) → Allocation suggestions

// Machine Learning:
- trainModel(trainingData) → Update AI model
- validatePrediction(predictionId, actualOutcome) → Model accuracy
```

## Smart Contract Deployment Flow

### Phase 1: Core Infrastructure
1. **HedVaultCore** - Central registry
2. **PriceOracle** - Price feed system
3. **ComplianceManager** - Regulatory framework
4. **RewardsDistributor** - Incentive system

### Phase 2: RWA Token System  
1. **RWATokenFactory** - Token creation
2. **RWAOffchainOracle** - Real-world pricing
3. **Marketplace** - P2P trading platform

### Phase 3: DeFi Functionality
1. **LendingPool** - Lending & borrowing
2. **SwapEngine** - AMM for RWA tokens  
3. **PortfolioManager** - Portfolio management

### Phase 4: Advanced Features
1. **CrossChainBridge** - Multi-chain support
2. **AIInsightsOracle** - AI-powered insights
3. **Integration** - Connect all systems

## Key Integration Points

### Frontend → Smart Contracts Mapping

**Dashboard Tab:**
- `useRWATokenFactoryTokens()` → RWATokenFactory.getAllRWATokensWithInfo()
- `useTokenBalance()` → ERC20.balanceOf()
- Portfolio values → PriceOracle.getPrice() + user balances

**Swap Tab:**
- `useSwap()` → SwapEngine.swap()  
- `useGetSwapQuote()` → SwapEngine.getSwapQuote()
- `useCreatePool()` → SwapEngine.createPool()
- `useAddSupportedToken()` → SwapEngine.addSupportedToken()

**Blend Tab (Lending):**
- `useDeposit()` → LendingPool.deposit()
- `useWithdraw()` → LendingPool.withdraw()  
- `useCreateLoan()` → LendingPool.createLoan()
- `useRepayLoan()` → LendingPool.repayLoan()

**Buy/Sell Tab:**
- Needs Marketplace.listToken(), Marketplace.buyTokens()
- Integration with price oracles for fair pricing

**AI Insights Tab:**
- Needs AIInsightsOracle implementation
- Integration with PortfolioManager for recommendations

**Bridge Tab:**  
- `useBridge()` → CrossChainBridge.bridgeToken()
- Multi-chain token transfers

**Rewards Tab:**
- `useClaimRewards()` → RewardsDistributor.claimRewards()
- Yield farming and staking rewards

## Required Contract Addresses Configuration

Create `/packages/frontend/src/lib/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  // Core Contracts
  XendCore: "0x...",
  PriceOracle: "0x...",
  
  // RWA System  
  RWATokenFactory: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  RWAOffchainOracle: "0x...",
  
  // DeFi Features
  LendingPool: "0x98fddd1d8b61b12c0634d52bb3fdb193806e93a5",
  SwapEngine: "0x12354dc2fe41577989c4c82f68ac4d4f34d3572e", 
  Marketplace: "0x...",
  
  // Advanced Features
  CrossChainBridge: "0x...",
  PortfolioManager: "0x...",  
  RewardsDistributor: "0x...",
  ComplianceManager: "0x...",
  AIInsightsOracle: "0x...",
  
  // Predefined RWA Tokens
  GOLD_TOKEN: "0x0000000000000000000000000000000000636359",
  SILVER_TOKEN: "0x00000000000000000000000000000000006363ad", 
  REAL_ESTATE_TOKEN: "0x00000000000000000000000000000000006363ba",
};

export const MANTLE_TESTNET_CHAIN_ID = 5001; // Mantle Testnet
// export const MANTLE_MAINNET_CHAIN_ID = 5000; // Mantle Mainnet
```

## Next Steps

1. **Copy Existing Contracts** - Copy all implemented contracts from Hedvault to Xend and rename HedVaultCore to XendCore
2. **Implement Missing Contracts** - Build Marketplace, AIInsightsOracle, enhanced RWAOffchainOracle
3. **Deploy to Mantle Blockchain** - Deploy all contracts to Mantle blockchain and get addresses
4. **Update Frontend** - Create proper contracts.ts with all addresses
5. **Integration Testing** - Test all frontend flows with deployed contracts
6. **AI Integration** - Connect AI models to smart contracts via oracles
7. **Mainnet Deployment** - Deploy to Mantle mainnet

## Security Considerations

- **Access Control**: Use OpenZeppelin's role-based access control
- **Pausable**: All critical functions should be pausable in emergencies  
- **ReentrancyGuard**: Protect against reentrancy attacks
- **Input Validation**: Validate all user inputs and external data
- **Oracle Security**: Use multiple price sources and validate data
- **Upgradability**: Consider using proxy patterns for future upgrades

This architecture provides a complete DeFi ecosystem for Real World Assets with AI-powered insights and cross-chain functionality.
