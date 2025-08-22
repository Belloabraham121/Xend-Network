"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  TrendingUp,
  Shield,
  PieChart,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccount } from "wagmi";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";
import { formatEther } from "viem";

interface PortfolioOverviewProps {
  showBalance: boolean;
  onToggleBalance: () => void;
}

export function PortfolioOverview({
  showBalance,
  onToggleBalance,
}: PortfolioOverviewProps) {
  const { address: userAddress } = useAccount();
  const {
    useGetPortfolioValue,
    useGetRiskScore,
    useCalculateRiskScore,
    useGetDiversificationScore,
    useGetUserAssets,
    useGetPortfolioPerformance,
  } = usePortfolioManager();

  // Fetch portfolio data
  const portfolioValue = useGetPortfolioValue(userAddress as `0x${string}`);
  const riskScore = useGetRiskScore(userAddress as `0x${string}`);
  const calculatedRiskScore = useCalculateRiskScore(userAddress as `0x${string}`);
  const diversificationScore = useGetDiversificationScore(
    userAddress as `0x${string}`
  );
  const userAssets = useGetUserAssets(userAddress as `0x${string}`);
  const portfolioPerformance = useGetPortfolioPerformance(
    userAddress as `0x${string}`
  );

  // Format values
  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toFixed(2);
  };

  const formatRiskLevel = (score: number) => {
    if (score <= 30) return { level: "Low", color: "text-green-400" };
    if (score <= 70) return { level: "Medium", color: "text-yellow-400" };
    return { level: "High", color: "text-red-400" };
  };

  const formatDiversification = (score: number) => {
    if (score >= 80) return { level: "Excellent", color: "text-green-400" };
    if (score >= 60) return { level: "Good", color: "text-blue-400" };
    if (score >= 40) return { level: "Fair", color: "text-yellow-400" };
    return { level: "Poor", color: "text-red-400" };
  };

  // Calculate values
  const totalValue = portfolioValue.data
    ? Number(formatEther(portfolioValue.data as bigint))
    : 0;
  const activePositions = userAssets.data
    ? (userAssets.data as `0x${string}`[]).length
    : 0;
  const riskLevel = riskScore.data ? Number(riskScore.data) : 0;
  const calculatedRisk = calculatedRiskScore.data ? Number(calculatedRiskScore.data) : 0;
  // Use calculated risk score if available, otherwise fall back to stored risk score
  const currentRiskLevel = calculatedRisk > 0 ? calculatedRisk : riskLevel;
  const diversificationLevel = diversificationScore.data
    ? Number(diversificationScore.data)
    : 0;
  const performance = portfolioPerformance.data
    ? Number(formatEther(portfolioPerformance.data as bigint))
    : 0;

  const riskInfo = formatRiskLevel(currentRiskLevel);
  const diversificationInfo = formatDiversification(diversificationLevel);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Portfolio Value */}
      <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800 hover:bg-gray-950/90 transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Total Portfolio Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-white">
              {showBalance ? `$${formatLargeNumber(totalValue)}` : "••••••"}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleBalance}
              className="text-gray-400 hover:text-white"
            >
              {showBalance ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm mt-2 font-medium text-green-400">
            {showBalance
              ? `${performance >= 0 ? "+" : ""}${performance.toFixed(2)}%`
              : "••••••"}{" "}
            this month
          </p>
        </CardContent>
      </Card>

      {/* Active Positions */}
      <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800 hover:bg-gray-950/90 transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Active Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-white">
              {activePositions}
            </div>
            <Activity className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-sm mt-2 font-medium text-gray-400">
            {activePositions > 0 ? "Diversified portfolio" : "No positions yet"}
          </p>
        </CardContent>
      </Card>

      {/* Risk Level */}
      <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800 hover:bg-gray-950/90 transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Risk Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-white">
              {riskInfo.level}
            </div>
            <Shield className="h-8 w-8 text-orange-400" />
          </div>
          <p className={`text-sm mt-2 font-medium ${riskInfo.color}`}>
            {currentRiskLevel}/100 risk score
          </p>
        </CardContent>
      </Card>

      {/* Diversification */}
      <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800 hover:bg-gray-950/90 transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Diversification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-white">
              {diversificationInfo.level}
            </div>
            <PieChart className="h-8 w-8 text-purple-400" />
          </div>
          <p
            className={`text-sm mt-2 font-medium ${diversificationInfo.color}`}
          >
            {diversificationLevel}/100 diversity score
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
