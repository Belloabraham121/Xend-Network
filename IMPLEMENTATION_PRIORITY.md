# Xend Implementation Priority List

Based on the frontend analysis and existing Hedvault contracts, here's what you need to implement:

## ✅ Already Implemented (In Hedvault)
- **XendCore** (formerly HedVaultCore) - Central registry and access control
- **LendingPool** - Complete lending/borrowing functionality  
- **SwapEngine** - AMM with liquidity pools and swapping
- **PriceOracle** - Price feed management
- **RewardsDistributor** - Incentive distribution
- **ComplianceManager** - KYC/AML compliance
- **RWATokenFactory** - Basic RWA token creation

## 🔴 High Priority - Must Implement

### 1. Frontend Configuration (`/packages/frontend/src/lib/contracts.ts`)
```typescript
export const CONTRACT_ADDRESSES = {
  XendCore: "0x7718032D7727fC38851bA83b452f5e10208B596F", // Renamed from HedVaultCore
  PriceOracle: "0x6dCbEA0Fa11B21a6B9F72BccaceFeb0B1ED0B444", 
  LendingPool: "0x98fddd1d8b61b12c0634d52bb3fdb193806e93a5",
  SwapEngine: "0x12354dc2fe41577989c4c82f68ac4d4f34d3572e",
  // Add remaining contracts as deployed
};

export const MANTLE_TESTNET_CHAIN_ID = 5001; // Mantle Testnet
// export const MANTLE_MAINNET_CHAIN_ID = 5000; // Mantle Mainnet
```

### 2. Marketplace Contract (Buy/Sell Tab needs this)
**Current Status:** Basic skeleton exists, needs full implementation

**Required Functions:**
```solidity
// Listing Management  
function listToken(address token, uint256 amount, uint256 pricePerToken, uint256 duration) external;
function updateListing(uint256 listingId, uint256 newPrice) external;
function cancelListing(uint256 listingId) external;

// Trading
function buyTokens(uint256 listingId, uint256 amount) external payable;
function instantBuy(address token, uint256 amount) external payable;

// View Functions
function getActiveListing(uint256 listingId) external view returns (ListingInfo);
function getUserListings(address user) external view returns (uint256[]);
function getTokenListings(address token) external view returns (uint256[]);
function getMarketStats() external view returns (MarketStats);
```

### 3. AI Insights Oracle (AI Insights Tab needs this)
**Current Status:** Does not exist - new contract needed

**Required Functions:**
```solidity
// AI Recommendations
function submitAIInsight(address user, uint8 insightType, bytes calldata data, uint256 confidence) external;
function getAIRecommendation(address user, uint8 assetClass) external view returns (AIRecommendation);
function getPortfolioOptimization(address user) external view returns (AllocationSuggestion[]);

// Market Analysis  
function updateMarketSentiment(uint8 assetType, int8 sentiment, uint256 confidence) external;
function getMarketTrends(uint8 assetType, uint256 timeframe) external view returns (TrendData);
function calculateRiskScore(address user, address token) external view returns (uint256);
```

### 4. Enhanced Buy/Sell Hooks (Frontend)
**Current Status:** Placeholder components exist

**Needed React Hooks:**
```typescript
// /packages/frontend/src/hooks/useMarketplace.ts
export const useListToken = () => { ... };
export const useBuyToken = () => { ... };  
export const useGetListings = (tokenAddress: Address) => { ... };
export const useGetUserListings = (user: Address) => { ... };
export const useUpdateListing = () => { ... };
export const useCancelListing = () => { ... };
```

## 🟡 Medium Priority - Enhance Existing

### 1. RWATokenFactory Enhancements
**Current Status:** Basic implementation exists

**Missing Features:**
- Token metadata updates
- Token pause/unpause functionality  
- Enhanced token creation with more metadata fields
- Integration with compliance checks

### 2. Cross-Chain Bridge
**Current Status:** Basic structure exists

**Missing Features:**
```solidity
function bridgeToken(address token, uint256 amount, uint256 destinationChain, address recipient) external;
function receiveToken(address token, uint256 amount, uint256 sourceChain, address sender) external;
function updateBridgeConfig(uint256 chain, address bridgeAddress, bool isActive) external;
```

### 3. Portfolio Manager Enhancement  
**Current Status:** Basic structure exists

**Missing Features:**
- AI model integration
- Portfolio analysis functions
- Risk assessment algorithms
- Rebalancing suggestions

## 🟢 Low Priority - Nice to Have

### 1. Advanced Rewards Features
- Staking mechanisms
- Multi-token reward distribution
- Time-based reward multipliers

### 2. Enhanced Compliance  
- Jurisdiction-based restrictions
- Automated compliance checking
- Integration with external KYC providers

### 3. Advanced Oracle Features
- Multiple price source aggregation
- Price deviation alerts  
- Historical price data storage

## Immediate Action Items

### Phase 1 (This Week)
1. **Copy Existing Contracts**: Copy all Hedvault contracts to Xend project and rename HedVaultCore to XendCore
2. **Create contracts.ts**: Set up proper contract addresses configuration for Mantle blockchain
3. **Deploy to Mantle Testnet**: Deploy all existing contracts to Mantle testnet and get addresses
4. **Test Integration**: Ensure frontend can communicate with deployed contracts

### Phase 2 (Next Week) 
1. **Implement Marketplace**: Complete the P2P trading functionality
2. **Build AI Oracle**: Create the AI insights smart contract
3. **Enhance Buy/Sell**: Complete the buy/sell tab functionality
4. **Integration Testing**: Test all user flows end-to-end

### Phase 3 (Following Weeks)
1. **Cross-Chain Bridge**: Implement multi-chain functionality
2. **AI Integration**: Connect AI models to smart contracts
3. **Advanced Features**: Add remaining nice-to-have features
4. **Security Audit**: Review and test all contracts thoroughly

## Smart Contract Deployment Checklist

### Pre-Deployment
- [ ] Copy all Hedvault contracts to Xend
- [ ] Rename HedVaultCore to XendCore throughout all contracts
- [ ] Review and customize for Xend branding
- [ ] Update constructor parameters
- [ ] Set up deployment scripts for Mantle blockchain

### Core Contracts Deploy Order
1. [ ] XendCore (renamed from HedVaultCore)
2. [ ] PriceOracle  
3. [ ] ComplianceManager
4. [ ] RewardsDistributor
5. [ ] RWATokenFactory
6. [ ] LendingPool
7. [ ] SwapEngine
8. [ ] Marketplace (new)
9. [ ] AIInsightsOracle (new)

### Post-Deployment
- [ ] Update contracts.ts with all addresses
- [ ] Configure contract permissions and roles
- [ ] Test all frontend interactions
- [ ] Deploy predefined RWA tokens (Gold, Silver, Real Estate)

## Key Dependencies

**Frontend → Contracts:**
- Dashboard needs: XendCore, RWATokenFactory, PriceOracle, ERC20 balances
- Swap needs: SwapEngine, supported token management
- Blend needs: LendingPool, token approvals
- Buy/Sell needs: Marketplace (new contract)  
- AI Insights needs: AIInsightsOracle (new contract)
- Bridge needs: CrossChainBridge (enhancement needed)
- Rewards needs: RewardsDistributor

**Contracts → External:**
- Price feeds: Chainlink oracles on Mantle or custom price providers
- AI models: External API integration via oracle pattern
- Compliance: External KYC/AML service integration
- Mantle blockchain: Ensure compatibility with Mantle's specific features and gas model

This roadmap will get your Xend platform fully functional with all the features shown in your frontend design.
