// Contract addresses and configuration for Mantle Testnet
// Generated from deployment artifacts

// Chain configuration
export const CHAIN_ID = 5003;
export const CHAIN_NAME = "Mantle Testnet";
export const RPC_URL = "https://rpc.sepolia.mantle.xyz";
export const BLOCK_EXPLORER_URL = "https://explorer.sepolia.mantle.xyz";

// Contract addresses from latest deployment
export const CONTRACTS = {
  ChainlinkPriceOracle: "0x8f1e22c51544dc4d66571d64f6dd01cb426d651f" as const,
  RewardAssetFactory: "0xae4e89df546994bde296bc2cc2d949961cb7a123" as const,
  PortfolioManager: "0x5b73c5498c1e3b4dba84de0f1833c4a029d90519" as const,
  RewardsDistributor: "0x569ba5be4384466f361f01f16c4918305f598456" as const,
  LendingPool: "0x415145771e2e065b689465ea8baa1952f930e461" as const,
  StrategyVault: "0x6d6a568fc9c5cb2e29ef037114437befdb6c85fb" as const,
  AssetMarketplace: "0xf23072b3a7d3050de55f94adc65e3931b26bec00" as const,
  // Additional contracts from integration documentation
  ComplianceManager: "0xcb33193f590227f71423007fe6d41f53da2ef0c8" as const,
  PriceOracle: "0x6dcbea0fa11b21a6b9f72bccacefeb0b1ed0b444" as const,
  RWAOffchainOracle: "0x526f1fd7e5e6220c8390c14fcb0b5a1c83d36e8d" as const,
} as const;

// Contract names for type safety
export type ContractName = keyof typeof CONTRACTS;

// Helper function to get contract address
export const getContractAddress = (contractName: ContractName): string => {
  return CONTRACTS[contractName];
};

// Verify all contracts are deployed on the correct chain
export const verifyChainId = (chainId: number): boolean => {
  return chainId === CHAIN_ID;
};

// Export individual addresses for convenience
export const {
  ChainlinkPriceOracle: CHAINLINK_PRICE_ORACLE_ADDRESS,
  RewardAssetFactory: REWARD_ASSET_FACTORY_ADDRESS,
  PortfolioManager: PORTFOLIO_MANAGER_ADDRESS,
  RewardsDistributor: REWARDS_DISTRIBUTOR_ADDRESS,
  LendingPool: LENDING_POOL_ADDRESS,
  StrategyVault: STRATEGY_VAULT_ADDRESS,
  AssetMarketplace: ASSET_MARKETPLACE_ADDRESS,
} = CONTRACTS;
