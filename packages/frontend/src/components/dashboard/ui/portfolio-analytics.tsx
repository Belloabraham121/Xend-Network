"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";
import { useAccount } from "wagmi";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  DollarSign,
  Percent,
} from "lucide-react";

interface PortfolioAnalyticsProps {
  showBalance?: boolean;
}

export function PortfolioAnalytics({
  showBalance = true,
}: PortfolioAnalyticsProps) {
  const { address } = useAccount();
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d"
  );

  const portfolioManager = usePortfolioManager();
  const { data: portfolioValue, isLoading: portfolioValueLoading } =
    portfolioManager.useGetPortfolioValue(address || "0x0");
  const { data: diversificationScore, isLoading: diversificationLoading } =
    portfolioManager.useGetDiversificationScore(address || "0x0");
  const { data: riskScore, isLoading: riskLoading } =
    portfolioManager.useGetRiskScore(address || "0x0");
  const { data: userAssets, isLoading: assetsLoading } =
    portfolioManager.useGetUserAssets(address || "0x0");
  const { data: portfolioPerformance, isLoading: performanceLoading } =
    portfolioManager.useGetPortfolioPerformance(address || "0x0");
  const { data: assetAllocation, isLoading: allocationLoading } =
    portfolioManager.useGetAssetAllocationByType(address || "0x0");
  const { data: performanceHistory, isLoading: historyLoading } =
    portfolioManager.useGetPerformanceHistory(address || "0x0");
  const { data: hasPortfolio } = portfolioManager.useUserHasPortfolio(
    address || "0x0"
  );

  const isLoading =
    portfolioValueLoading ||
    diversificationLoading ||
    riskLoading ||
    assetsLoading ||
    performanceLoading ||
    allocationLoading ||
    historyLoading;

  // Process performance history from contract
  const processPerformanceData = () => {
    if (
      !performanceHistory ||
      !Array.isArray(performanceHistory) ||
      performanceHistory.length === 0
    ) {
      // Fallback mock data if no contract data
      return {
        "7d": [
          { date: "2024-01-01", value: 95000 },
          { date: "2024-01-02", value: 97000 },
          { date: "2024-01-03", value: 96500 },
          { date: "2024-01-04", value: 98000 },
          { date: "2024-01-05", value: 99500 },
          { date: "2024-01-06", value: 101000 },
          { date: "2024-01-07", value: 100000 },
        ],
        "30d": [
          { date: "2023-12-01", value: 90000 },
          { date: "2023-12-08", value: 92000 },
          { date: "2023-12-15", value: 95000 },
          { date: "2023-12-22", value: 97000 },
          { date: "2023-12-29", value: 98000 },
          { date: "2024-01-05", value: 99500 },
          { date: "2024-01-12", value: 100000 },
        ],
        "90d": [
          { date: "2023-10-01", value: 85000 },
          { date: "2023-10-15", value: 87000 },
          { date: "2023-11-01", value: 89000 },
          { date: "2023-11-15", value: 91000 },
          { date: "2023-12-01", value: 93000 },
          { date: "2023-12-15", value: 96000 },
          { date: "2024-01-01", value: 100000 },
        ],
        "1y": [
          { date: "2023-01-01", value: 75000 },
          { date: "2023-03-01", value: 78000 },
          { date: "2023-06-01", value: 82000 },
          { date: "2023-09-01", value: 85000 },
          { date: "2023-12-01", value: 95000 },
          { date: "2024-01-01", value: 100000 },
        ],
      };
    }

    // Convert contract performance history to chart data
    const now = Date.now();
    const timeRanges = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };

    const result: Record<string, Array<{ date: string; value: number }>> = {};

    Object.entries(timeRanges).forEach(([period, range]) => {
      const cutoffTime = now - range;
      const filteredHistory = performanceHistory
        .filter(
          (snapshot: {
            timestamp: bigint;
            totalValue: bigint;
            cumulativeReturn: bigint;
          }) => {
            const snapshotTime = Number(snapshot.timestamp) * 1000;
            return snapshotTime >= cutoffTime;
          }
        )
        .map(
          (snapshot: {
            timestamp: bigint;
            totalValue: bigint;
            cumulativeReturn: bigint;
          }) => ({
            date: new Date(Number(snapshot.timestamp) * 1000)
              .toISOString()
              .split("T")[0],
            value: Number(snapshot.totalValue) / 1e18, // Convert from wei
          })
        );

      result[period] =
        filteredHistory.length > 0
          ? filteredHistory
          : [
              {
                date: new Date(cutoffTime).toISOString().split("T")[0],
                value: 0,
              },
              {
                date: new Date(now).toISOString().split("T")[0],
                value: Number(portfolioValue || 0) / 1e18,
              },
            ];
    });

    return result;
  };

  const performanceData = processPerformanceData();

  const currentData = performanceData[timeframe];
  const currentValue = currentData[currentData.length - 1]?.value || 0;
  const previousValue = currentData[currentData.length - 2]?.value || 0;
  const change = currentValue - previousValue;
  const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;

  // Process asset allocation from contract
  const processAssetAllocation = () => {
    if (!assetAllocation || !Array.isArray(assetAllocation)) {
      // Fallback mock data
      return [
        { name: "Real Estate", value: 40, color: "#3B82F6" },
        { name: "Commodities", value: 25, color: "#10B981" },
        { name: "Infrastructure", value: 20, color: "#F59E0B" },
        { name: "Art & Collectibles", value: 10, color: "#EF4444" },
        { name: "Private Equity", value: 3, color: "#8B5CF6" },
        { name: "Other", value: 2, color: "#6B7280" },
      ];
    }

    const assetTypeNames = [
      "Real Estate",
      "Commodities",
      "Infrastructure",
      "Art & Collectibles",
      "Private Equity",
      "Other",
    ];
    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#6B7280",
    ];

    return assetAllocation
      .map((allocation: bigint, index: number) => ({
        name: assetTypeNames[index] || `Asset ${index + 1}`,
        value: Number(allocation) / 100, // Convert from basis points to percentage
        color: colors[index] || "#6B7280",
      }))
      .filter((item: { value: number }) => item.value > 0);
  };

  const allocationData = processAssetAllocation();

  // Process risk metrics from contract performance data
  const processRiskMetrics = () => {
    if (
      !portfolioPerformance ||
      !Array.isArray(portfolioPerformance) ||
      portfolioPerformance.length < 4
    ) {
      // Fallback mock data
      return [
        { label: "Volatility", value: "12.5%", status: "moderate" },
        { label: "Sharpe Ratio", value: "1.8", status: "good" },
        { label: "Max Drawdown", value: "8.2%", status: "low" },
        { label: "Beta", value: "0.85", status: "moderate" },
      ];
    }

    const [totalReturn, annualizedReturn, volatility, sharpeRatio] =
      portfolioPerformance;

    const getStatus = (value: number, thresholds: [number, number]) => {
      if (value <= thresholds[0]) return "good";
      if (value <= thresholds[1]) return "moderate";
      return "high";
    };

    const volatilityPercent = Number(volatility) / 100;
    const sharpeValue = Number(sharpeRatio) / 10000;
    const maxDrawdown = Math.min(Number(totalReturn) / 100, 15); // Estimate max drawdown

    return [
      {
        label: "Volatility",
        value: `${volatilityPercent.toFixed(1)}%`,
        status: getStatus(volatilityPercent, [10, 20]),
      },
      {
        label: "Sharpe Ratio",
        value: sharpeValue.toFixed(2),
        status:
          sharpeValue >= 1.5 ? "good" : sharpeValue >= 1.0 ? "moderate" : "low",
      },
      {
        label: "Max Drawdown",
        value: `${maxDrawdown.toFixed(1)}%`,
        status: getStatus(maxDrawdown, [5, 10]),
      },
      {
        label: "Annual Return",
        value: `${(Number(annualizedReturn) / 100).toFixed(1)}%`,
        status:
          Number(annualizedReturn) >= 1000
            ? "good"
            : Number(annualizedReturn) >= 500
            ? "moderate"
            : "low",
      },
    ];
  };

  const riskMetrics = processRiskMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="h-32 bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Show message if user doesn't have a portfolio
  if (!hasPortfolio) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No Portfolio Found
            </h3>
            <p>
              Create your first portfolio to view analytics and performance
              metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Portfolio Performance
            </CardTitle>
            <div className="flex gap-2">
              {(["7d", "30d", "90d", "1y"] as const).map((period) => (
                <Button
                  key={period}
                  variant={timeframe === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeframe(period)}
                  className={`text-xs ${
                    timeframe === period
                      ? "bg-blue-600 text-white"
                      : "border-gray-600 text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  {period}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  address &&
                  portfolioManager.takePerformanceSnapshot(
                    address as `0x${string}`
                  )
                }
                disabled={!address || portfolioManager.isPending}
                className="text-xs border-gray-600 text-gray-300 hover:bg-gray-800 ml-2"
              >
                📸 Snapshot
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-white">
                {showBalance
                  ? portfolioValue
                    ? `$${(Number(portfolioValue) / 1e18).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )}`
                    : `$${currentValue.toLocaleString()}`
                  : "••••••"}
              </div>
              <div
                className={`flex items-center gap-1 ${
                  change >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {change >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {change >= 0 ? "+" : ""}
                  {changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Simple line chart representation */}
          <div className="h-48 bg-gray-800 rounded-lg p-4 flex items-end justify-between">
            {currentData.map((point, index) => {
              const height =
                ((point.value - Math.min(...currentData.map((d) => d.value))) /
                  (Math.max(...currentData.map((d) => d.value)) -
                    Math.min(...currentData.map((d) => d.value)))) *
                100;
              return (
                <div
                  key={index}
                  className="bg-blue-500 w-8 rounded-t transition-all hover:bg-blue-400"
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${point.date}: $${point.value.toLocaleString()}`}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allocationData.map((asset, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: asset.color }}
                    />
                    <span className="text-gray-300">{asset.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                      {asset.value}%
                    </span>
                    <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: asset.color,
                          width: `${asset.value}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Metrics */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Risk Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-300">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                      {metric.value}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        metric.status === "good"
                          ? "border-green-500 text-green-400"
                          : metric.status === "moderate"
                          ? "border-yellow-500 text-yellow-400"
                          : "border-red-500 text-red-400"
                      }`}
                    >
                      {metric.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Insights */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Portfolio Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-2">
                {showBalance
                  ? `${
                      diversificationScore ? Number(diversificationScore) : 0
                    }%`
                  : "••%"}
              </div>
              <div className="text-gray-300 text-sm">Diversification Score</div>
              <div className="text-xs text-gray-500 mt-1">
                {diversificationScore
                  ? Number(diversificationScore) >= 80
                    ? "Well diversified"
                    : Number(diversificationScore) >= 60
                    ? "Moderately diversified"
                    : "Needs diversification"
                  : "No data"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">
                {showBalance
                  ? `${riskScore ? Number(riskScore) / 100 : 0}/10`
                  : "•••/10"}
              </div>
              <div className="text-gray-300 text-sm">Risk Score</div>
              <div className="text-xs text-gray-500 mt-1">
                {riskScore
                  ? Number(riskScore) <= 300
                    ? "Low risk"
                    : Number(riskScore) <= 700
                    ? "Moderate risk"
                    : "High risk"
                  : "No data"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-2">
                {showBalance
                  ? portfolioPerformance &&
                    Array.isArray(portfolioPerformance) &&
                    portfolioPerformance.length >= 2
                    ? `${(Number(portfolioPerformance[1]) / 100).toFixed(1)}%`
                    : "0.0%"
                  : "••.•%"}
              </div>
              <div className="text-gray-300 text-sm">Annual Return</div>
              <div className="text-xs text-gray-500 mt-1">
                {portfolioPerformance &&
                Array.isArray(portfolioPerformance) &&
                portfolioPerformance.length >= 2
                  ? Number(portfolioPerformance[1]) >= 1000
                    ? "Above average"
                    : Number(portfolioPerformance[1]) >= 500
                    ? "Average"
                    : "Below average"
                  : "No data"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
