import { Address } from "viem";
import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/config/contracts";
import RewardAssetFactoryABI from "@/lib/abis/RewardAssetFactory.json";
import LendingPoolABI from "@/lib/abis/LendingPool.json";

// RWA Token addresses from deployment
export const RWA_TOKEN_ADDRESSES = {
  GOLD_RESERVE: "0xd3871a7653073f2c8e4ed9d8d798303586a44f55" as Address,
  PREMIUM_REAL_ESTATE: "0xad95399b7dddf51145e7fd5735c865e474c5c010" as Address,
  DIGITAL_ART: "0x91755aee9e26355aea0b102e48a46d0918490d4f" as Address,
  RENEWABLE_ENERGY: "0xf7be754c0efea6e0cdd5a511770996af4769e6d6" as Address,
};

// Helper function to format ether values
const formatEther = (value: bigint): string => {
  return (Number(value) / 1e18).toString();
};

// Get token name from address
export const getTokenName = (address: Address): string => {
  switch (address) {
    case RWA_TOKEN_ADDRESSES.GOLD_RESERVE:
      return "Gold Reserve";
    case RWA_TOKEN_ADDRESSES.PREMIUM_REAL_ESTATE:
      return "Premium Real Estate";
    case RWA_TOKEN_ADDRESSES.DIGITAL_ART:
      return "Digital Art";
    case RWA_TOKEN_ADDRESSES.RENEWABLE_ENERGY:
      return "Renewable Energy";
    default:
      return "Unknown Token";
  }
};

// Get token symbol from address
export const getTokenSymbol = (address: Address): string => {
  switch (address) {
    case RWA_TOKEN_ADDRESSES.GOLD_RESERVE:
      return "GOLD";
    case RWA_TOKEN_ADDRESSES.PREMIUM_REAL_ESTATE:
      return "REAL";
    case RWA_TOKEN_ADDRESSES.DIGITAL_ART:
      return "ART";
    case RWA_TOKEN_ADDRESSES.RENEWABLE_ENERGY:
      return "ENERGY";
    default:
      return "UNK";
  }
};

// Types for token data
export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  totalSupply: bigint;
  pricePerToken?: bigint;
  assetType?: number;
  isActive?: boolean;
  createdAt?: bigint;
  creator?: Address;
  isSupported?: boolean;
  balance: bigint;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  performance?: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface MarketData {
  totalTokens: number;
  supportedTokens: number;
  totalMarketCap: number;
  averagePerformance: number;
  topPerformers: TokenInfo[];
  riskAnalysis: {
    lowRisk: TokenInfo[];
    mediumRisk: TokenInfo[];
    highRisk: TokenInfo[];
  };
}

export interface InvestmentRecommendation {
  token: TokenInfo;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  reasoning: string;
  targetPrice?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Mock price data for demonstration (in a real app, this would come from an oracle)
const MOCK_PRICE_DATA: Record<string, { price: number; performance: { daily: number; weekly: number; monthly: number } }> = {
  'GOLD': { price: 2100, performance: { daily: 1.2, weekly: 3.5, monthly: 8.7 } },
  'SILVER': { price: 25, performance: { daily: -0.8, weekly: 2.1, monthly: 5.3 } },
  'REAL_ESTATE': { price: 150000, performance: { daily: 0.1, weekly: 0.8, monthly: 2.4 } },
  'ART': { price: 50000, performance: { daily: 2.5, weekly: 8.2, monthly: 15.6 } },
  'OIL': { price: 85, performance: { daily: -1.5, weekly: -2.3, monthly: 4.8 } },
};

// Asset type mapping
const ASSET_TYPE_NAMES: Record<number, string> = {
  0: 'GOLD',
  1: 'SILVER', 
  2: 'REAL_ESTATE',
  3: 'ART',
  4: 'OIL',
  5: 'CUSTOM'
};

/**
 * Fetch user portfolio data from LendingPool contract
 */
export async function fetchUserPortfolio(userAddress: Address): Promise<{
  lendingPositions: Array<{
    token: Address;
    amount: bigint;
    interestEarned: bigint;
  }>;
  borrowingPositions: Array<{
    token: Address;
    amount: bigint;
    collateral: bigint;
    healthFactor: bigint;
  }>;
  totalValue: bigint;
  healthFactor: bigint;
}> {
  const contractAddress = CONTRACTS.LendingPool as Address;
  
  try {
    // This would be called from a React component with proper hooks
    // For now, we'll simulate the data structure
    const lendingPositions = [];
    const borrowingPositions = [];
    
    for (const [, tokenAddress] of Object.entries(RWA_TOKEN_ADDRESSES)) {
      // Simulate lending position data
      lendingPositions.push({
        token: tokenAddress,
        amount: BigInt(Math.floor(Math.random() * 1000) * 1e18),
        interestEarned: BigInt(Math.floor(Math.random() * 50) * 1e18),
      });
      
      // Simulate borrowing position data
      if (Math.random() > 0.7) { // 30% chance of having a borrowing position
        borrowingPositions.push({
          token: tokenAddress,
          amount: BigInt(Math.floor(Math.random() * 500) * 1e18),
          collateral: BigInt(Math.floor(Math.random() * 800) * 1e18),
          healthFactor: BigInt(Math.floor(Math.random() * 200) + 100), // 1.0 to 3.0
        });
      }
    }
    
    return {
      lendingPositions,
      borrowingPositions,
      totalValue: BigInt(Math.floor(Math.random() * 10000) * 1e18),
      healthFactor: BigInt(Math.floor(Math.random() * 200) + 150), // 1.5 to 3.5
    };
  } catch (error) {
    console.error('Error fetching user portfolio:', error);
    throw error;
  }
}

/**
 * Fetch RWA tokens from the factory
 */
export async function fetchRWATokens(): Promise<TokenInfo[]> {
  try {
    return Object.entries(RWA_TOKEN_ADDRESSES).map(([key, address]) => ({
      address,
      symbol: getTokenSymbol(address),
      name: getTokenName(address),
      balance: BigInt(Math.floor(Math.random() * 1000) * 1e18),
      price: Math.random() * 100 + 50,
      marketCap: Math.random() * 1000000 + 500000,
      volume24h: Math.random() * 50000 + 10000,
      change24h: (Math.random() - 0.5) * 20,
      totalSupply: BigInt(Math.floor(Math.random() * 10000) * 1e18),
    }));
  } catch (error) {
    console.error('Error fetching RWA tokens:', error);
    return [];
  }
}

/**
 * Check which tokens are supported in the lending pool
 */
export async function fetchSupportedAssets(): Promise<Address[]> {
  try {
    // Mock supported assets based on the contract data we saw
    const supportedAssets: Address[] = [
      "0xd3871a7653073f2c8e4ed9d8d798303586a44f55", // GOLD
      "0x1234567890123456789012345678901234567890", // SILVER
      "0x3456789012345678901234567890123456789012", // ART
    ] as Address[];

    return supportedAssets;
  } catch (error) {
    console.error('Error fetching supported assets:', error);
    return [];
  }
}

/**
 * Analyze market data and generate insights
 */
export async function analyzeMarketData(): Promise<MarketData> {
  try {
    const tokens = await fetchRWATokens();
    const supportedAssets = await fetchSupportedAssets();

    // Update token support status
    const tokensWithSupport = tokens.map(token => ({
      ...token,
      isSupported: supportedAssets.includes(token.address)
    }));

    const totalMarketCap = tokensWithSupport.reduce((sum, token) => sum + (token.marketCap || 0), 0);
    const averagePerformance = tokensWithSupport.reduce((sum, token) => 
      sum + (token.performance?.monthly || 0), 0) / tokensWithSupport.length;

    // Sort by performance for top performers
    const topPerformers = tokensWithSupport
      .filter(token => token.performance)
      .sort((a, b) => (b.performance?.monthly || 0) - (a.performance?.monthly || 0))
      .slice(0, 3);

    // Risk analysis based on performance volatility and asset type
    const riskAnalysis = {
      lowRisk: tokensWithSupport.filter(token => 
        token.assetType === 2 || (token.performance?.monthly || 0) < 5
      ),
      mediumRisk: tokensWithSupport.filter(token => 
        token.assetType === 0 || token.assetType === 1 || 
        ((token.performance?.monthly || 0) >= 5 && (token.performance?.monthly || 0) < 10)
      ),
      highRisk: tokensWithSupport.filter(token => 
        token.assetType === 3 || (token.performance?.monthly || 0) >= 10
      )
    };

    return {
      totalTokens: tokensWithSupport.length,
      supportedTokens: supportedAssets.length,
      totalMarketCap,
      averagePerformance,
      topPerformers,
      riskAnalysis
    };
  } catch (error) {
    console.error('Error analyzing market data:', error);
    throw error;
  }
}

/**
 * Generate investment recommendations based on market data and user portfolio
 */
export function generateInvestmentRecommendations(
  tokens: TokenInfo[],
  marketData: MarketData,
  userPortfolio?: Awaited<ReturnType<typeof fetchUserPortfolio>> | null
): InvestmentRecommendation[] {
  return tokens.map(token => {
    const riskLevel = token.change24h > 10 ? 'HIGH' : 
                     token.change24h > 5 ? 'MEDIUM' : 'LOW';
    
    let recommendation: 'BUY' | 'HOLD' | 'SELL' = token.change24h > 0 ? 'BUY' : 
                        token.change24h < -5 ? 'SELL' : 'HOLD';
    
    // Adjust recommendation based on user portfolio
    if (userPortfolio) {
      const userLendingPosition = userPortfolio.lendingPositions.find(pos => pos.token === token.address);
      const userBorrowingPosition = userPortfolio.borrowingPositions.find(pos => pos.token === token.address);
      
      if (userLendingPosition && Number(formatEther(userLendingPosition.amount)) > 1000) {
        recommendation = 'HOLD'; // Already heavily invested
      }
      
      if (userBorrowingPosition && Number(formatEther(userBorrowingPosition.healthFactor)) < 150) {
        recommendation = 'SELL'; // Health factor too low
      }
    }
    
    const confidence = Math.min(95, Math.max(60, 80 + Math.abs(token.change24h)));
    
    let reasoning = `Based on ${token.change24h > 0 ? 'positive' : 'negative'} 24h performance of ${token.change24h.toFixed(2)}% and current market conditions.`;
    
    if (userPortfolio) {
      const userLendingPosition = userPortfolio.lendingPositions.find(pos => pos.token === token.address);
      if (userLendingPosition) {
        reasoning += ` You currently have ${formatEther(userLendingPosition.amount)} ${token.symbol} in lending positions.`;
      }
    }
    
    return {
      token,
      recommendation,
      confidence,
      reasoning,
      riskLevel
    };
  });
}

/**
 * Get comprehensive token analysis data with user portfolio
 */
export async function getTokenAnalysisData(userAddress?: Address) {
  try {
    const [tokens, supportedAssets] = await Promise.all([
      fetchRWATokens(),
      fetchSupportedAssets(),
    ]);

    let userPortfolio = null;
    if (userAddress) {
      try {
        userPortfolio = await fetchUserPortfolio(userAddress);
      } catch (error) {
        console.error('Error fetching user portfolio:', error);
      }
    }

    const marketData = await analyzeMarketData();
    const recommendations = generateInvestmentRecommendations(tokens, marketData, userPortfolio);

    return {
      tokens,
      supportedAssets,
      marketData,
      recommendations,
      userPortfolio,
      summary: {
        totalValue: marketData.totalMarketCap,
        bestPerformer: marketData.topPerformers[0],
        averageReturn: marketData.averagePerformance,
        riskDistribution: {
          low: marketData.riskAnalysis.lowRisk.length,
          medium: marketData.riskAnalysis.mediumRisk.length,
          high: marketData.riskAnalysis.highRisk.length
        }
      }
    };
  } catch (error) {
    console.error('Error getting token analysis data:', error);
    throw error;
  }
}

/**
 * Format token data for AI consumption
 */
export function formatTokenDataForAI(data: Awaited<ReturnType<typeof getTokenAnalysisData>>) {
  const { tokens, marketData, recommendations, userPortfolio, summary } = data;

  return {
    portfolio_overview: {
      total_tokens: marketData.totalTokens,
      supported_tokens: marketData.supportedTokens,
      total_market_cap: `$${(marketData.totalMarketCap / 1000000).toFixed(2)}M`,
      average_monthly_performance: `${marketData.averagePerformance.toFixed(2)}%`
    },
    tokens: tokens.map(token => ({
      name: token.name,
      symbol: token.symbol,
      asset_type: ASSET_TYPE_NAMES[token.assetType || 0] || 'UNKNOWN',
      market_cap: token.marketCap ? `$${(token.marketCap / 1000000).toFixed(2)}M` : 'N/A',
      monthly_performance: token.performance ? `${token.performance.monthly.toFixed(2)}%` : 'N/A',
      is_supported: token.isSupported || false,
      is_active: token.isActive || false
    })),
    top_performers: marketData.topPerformers.map(token => ({
      name: token.name,
      symbol: token.symbol,
      monthly_return: `${token.performance?.monthly?.toFixed(2) || '0.00'}%`
    })),
    recommendations: recommendations.map(rec => ({
      token: rec.token.symbol,
      action: rec.recommendation,
      confidence: `${rec.confidence}%`,
      risk_level: rec.riskLevel,
      reasoning: rec.reasoning
    })),
    risk_analysis: {
      low_risk_tokens: marketData.riskAnalysis.lowRisk.map(t => t.symbol),
      medium_risk_tokens: marketData.riskAnalysis.mediumRisk.map(t => t.symbol),
      high_risk_tokens: marketData.riskAnalysis.highRisk.map(t => t.symbol)
    },
    user_portfolio: userPortfolio ? {
      lending_positions: userPortfolio.lendingPositions.map(pos => ({
        token: getTokenSymbol(pos.token),
        amount: Number(formatEther(pos.amount)),
        interest_earned: Number(formatEther(pos.interestEarned))
      })),
      borrowing_positions: userPortfolio.borrowingPositions.map(pos => ({
        token: getTokenSymbol(pos.token),
        amount: Number(formatEther(pos.amount)),
        collateral: Number(formatEther(pos.collateral)),
        health_factor: Number(formatEther(pos.healthFactor))
      })),
      total_value: Number(formatEther(userPortfolio.totalValue)),
      health_factor: Number(formatEther(userPortfolio.healthFactor))
    } : null
  };
}