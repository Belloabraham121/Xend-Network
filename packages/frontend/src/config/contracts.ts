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
  PortfolioManager: "0x3Ea5f30Bf62f0ADB515760055E49c30B987Bd079" as const,
  RewardsDistributor: "0x569ba5be4384466f361f01f16c4918305f598456" as const,
  LendingPool: "0xFeE2CC90da44D83A4C1426d67EdD0F3b03d0204e" as const,
  StrategyVault: "0x6d6a568fc9c5cb2e29ef037114437befdb6c85fb" as const,
  AssetMarketplace: "0xf23072b3a7d3050de55f94adc65e3931b26bec00" as const,
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
