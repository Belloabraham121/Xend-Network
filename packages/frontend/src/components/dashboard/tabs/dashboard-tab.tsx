"use client";

import { useState } from "react";
import { Eye, EyeOff, TrendingUp, DollarSign, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortfolioCard } from "../ui/portfolio-card";
import { PredefinedRWATokens } from "../ui/predefined-rwa-tokens";

import { useAccount } from "wagmi";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";

// Helper function to replace formatEther
const formatEther = (value: bigint): string => {
  return (Number(value) / 1e18).toString();
};

// Format large numbers with abbreviations and commas
const formatLargeNumber = (num: number) => {
  if (num >= 1e9) {
    const billions = num / 1e9;
    return (
      billions.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + "B"
    );
  } else if (num >= 1e6) {
    const millions = num / 1e6;
    return (
      millions.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + "M"
    );
  } else if (num >= 1e3) {
    const thousands = num / 1e3;
    return (
      thousands.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + "K"
    );
  }
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

interface RWAMetadata {
  assetType: string;
  location: string;
  valuation: bigint;
  oracle: `0x${string}`;
  totalSupply: bigint;
  minInvestment: bigint;
  certificationHash: string;
  additionalData: string;
}

interface AssetInfo {
  tokenAddress: `0x${string}`;
  creator: `0x${string}`;
  creationTime: bigint;
  metadata: RWAMetadata;
  complianceLevel: number;
  isListed: boolean;
  tradingVolume: bigint;
  holders: bigint;
}

interface TokenBalanceRowProps {
  tokenAddress: `0x${string}`;
  assetInfo: AssetInfo;
  userAddress: `0x${string}` | undefined;
  showBalance: boolean;
}

function TokenBalanceRow({
  tokenAddress,
  assetInfo,
  userAddress,
  showBalance,
}: TokenBalanceRowProps) {
  // Mock token balance
  const tokenBalance = {
    data: BigInt("1000000000000000000000"),
    isLoading: false,
  };

  const formatCurrency = (value: bigint) => {
    return Number(value) / 1e18;
  };

  const userTokenBalance = tokenBalance.data || BigInt(0);
  const tokenValue = formatCurrency(assetInfo.metadata.valuation);
  const userBalanceFormatted = Number(formatEther(userTokenBalance));
  const userValueUSD =
    userBalanceFormatted *
    (tokenValue / Number(formatEther(assetInfo.metadata.totalSupply)));

  return (
    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-white text-lg">
              {assetInfo.metadata.assetType}
            </h4>
            <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">
              {assetInfo.metadata.location}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Your Balance</p>
              <p className="text-white font-medium">
                {showBalance
                  ? `${formatLargeNumber(userBalanceFormatted)} tokens`
                  : "••••••"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Value (USD)</p>
              <p className="text-green-400 font-medium">
                {showBalance ? `$${formatLargeNumber(userValueUSD)}` : "••••••"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Token Price</p>
              <p className="text-white">
                $
                {formatLargeNumber(
                  tokenValue /
                    Number(formatEther(assetInfo.metadata.totalSupply))
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Total Supply</p>
              <p className="text-white">
                {formatLargeNumber(
                  Number(formatEther(assetInfo.metadata.totalSupply))
                )}{" "}
                tokens
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardTab() {
  const [showBalance, setShowBalance] = useState(true);
  const { address: userAddress } = useAccount();
  const portfolioManager = usePortfolioManager();

  // Get portfolio data from smart contract
  const { data: userPortfolio } = portfolioManager.useGetUserPortfolio(
    userAddress || "0x0000000000000000000000000000000000000000"
  );
  const { data: portfolioValue } = portfolioManager.useGetPortfolioValue(
    userAddress || "0x0000000000000000000000000000000000000000"
  );
  const { data: userAssets } = portfolioManager.useGetUserAssets(
    userAddress || "0x0000000000000000000000000000000000000000"
  );
  const { data: riskScore } = portfolioManager.useGetRiskScore(
    userAddress || "0x0000000000000000000000000000000000000000"
  );
  const { data: diversificationScore } =
    portfolioManager.useGetDiversificationScore(
      userAddress || "0x0000000000000000000000000000000000000000"
    );

  // Mock factory tokens data
  const tokenAddresses: `0x${string}`[] = [];
  const assetInfos: AssetInfo[] = [];

  // Mock balances for predefined RWA tokens
  const goldBalance = { data: BigInt("5000000000000000000"), isLoading: false }; // 5 GOLD tokens
  const silverBalance = {
    data: BigInt("100000000000000000000"),
    isLoading: false,
  }; // 100 SILVER tokens
  const realEstateBalance = {
    data: BigInt("2000000000000000000"),
    isLoading: false,
  }; // 2 RE tokens

  // Format currency helper function
  const formatCurrency = (value: bigint) => {
    return Number(value) / 1e18;
  };

  // Calculate total portfolio value from smart contract data
  const calculateUserPortfolioValue = () => {
    // Return 0 if no wallet is connected
    if (!userAddress) {
      return 0;
    }

    // Use smart contract portfolio value if available
    if (portfolioValue && userAddress && typeof portfolioValue === "bigint") {
      return Number(formatEther(portfolioValue));
    }

    // Fallback to mock calculation for predefined tokens when wallet is connected
    let totalValue = 0;
    const goldValue = goldBalance.data
      ? Number(formatEther(goldBalance.data)) * 2000
      : 0;
    const silverValue = silverBalance.data
      ? Number(formatEther(silverBalance.data)) * 25
      : 0;
    const realEstateValue = realEstateBalance.data
      ? Number(formatEther(realEstateBalance.data)) * 500
      : 0;

    totalValue += goldValue + silverValue + realEstateValue;
    return totalValue;
  };

  const totalValue = calculateUserPortfolioValue();
  const totalTokenCount =
    (Array.isArray(userAssets) ? userAssets.length : 0) ||
    tokenAddresses.length +
      (goldBalance.data && goldBalance.data > 0 ? 1 : 0) +
      (silverBalance.data && silverBalance.data > 0 ? 1 : 0) +
      (realEstateBalance.data && realEstateBalance.data > 0 ? 1 : 0);

  // Get risk level based on risk score
  const getRiskLevel = (score?: bigint | number) => {
    if (!score) return "Unknown";
    const numScore = typeof score === "bigint" ? Number(score) : score;
    if (numScore <= 30) return "Low";
    if (numScore <= 70) return "Medium";
    return "High";
  };

  // Mock transactions for now - can be enhanced with real data later
  const recentTransactions = [
    {
      type: "Buy",
      asset: "RET",
      amount: "100.00",
      value: "$10,000",
      time: "2 hours ago",
    },
    {
      type: "Swap",
      asset: "GOLD → INV",
      amount: "5.25",
      value: "$5,250",
      time: "1 day ago",
    },
    {
      type: "Lend",
      asset: "ART",
      amount: "2.00",
      value: "$10,000",
      time: "3 days ago",
    },
    {
      type: "Reward",
      asset: "RET",
      amount: "12.50",
      value: "$1,250",
      time: "1 week ago",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Legacy Portfolio Overview - keeping for comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PortfolioCard
          title="Legacy Total Value"
          value={showBalance ? `$${formatLargeNumber(totalValue)}` : "••••••"}
          change={`${totalTokenCount} RWA tokens`}
          changeType="positive"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBalance(!showBalance)}
            className="text-gray-400 hover:text-white"
          >
            {showBalance ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </PortfolioCard>

        <PortfolioCard
          title="Legacy Active Positions"
          value={assetInfos.length.toString()}
          change={`Across ${
            new Set(assetInfos.map((info) => info.metadata.assetType)).size
          } asset classes`}
        />

        <PortfolioCard
          title="Risk Level"
          value={getRiskLevel(riskScore as bigint | number)}
          change={riskScore ? `Score: ${Number(riskScore)}` : "N/A"}
          changeType={
            getRiskLevel(riskScore as bigint | number) === "Low"
              ? "positive"
              : "negative"
          }
        />

        <PortfolioCard
          title="Diversification"
          value={
            diversificationScore ? `${Number(diversificationScore)}%` : "N/A"
          }
          change="Portfolio spread"
          changeType={
            diversificationScore
              ? Number(diversificationScore) > 50
                ? "positive"
                : "negative"
              : "positive"
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button className="h-16 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 hover:text-green-300">
          <TrendingUp className="h-5 w-5 mr-3" />
          Quick Buy
        </Button>
        <Button className="h-16 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:text-blue-300">
          <Activity className="h-5 w-5 mr-3" />
          Quick Swap
        </Button>
        <Button className="h-16 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 hover:text-purple-300">
          <DollarSign className="h-5 w-5 mr-3" />
          Start Lending
        </Button>
      </div>

      {/* Predefined RWA Tokens */}
      <PredefinedRWATokens className="bg-gray-950/80 backdrop-blur-sm border-gray-800" />
    </div>
  );
}
