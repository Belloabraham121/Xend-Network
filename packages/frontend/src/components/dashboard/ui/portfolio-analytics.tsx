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

export function PortfolioAnalytics({ showBalance = true }: PortfolioAnalyticsProps) {
  const { address } = useAccount();
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  
  const portfolioManager = usePortfolioManager();
  const { data: portfolioValue, isLoading: portfolioValueLoading } = portfolioManager.useGetPortfolioValue(address || "0x0");
  const { data: diversificationScore, isLoading: diversificationLoading } = portfolioManager.useGetDiversificationScore(address || "0x0");
  const { data: riskScore, isLoading: riskLoading } = portfolioManager.useGetRiskScore(address || "0x0");
  const { data: userAssets, isLoading: assetsLoading } = portfolioManager.useGetUserAssets(address || "0x0");
  const { data: portfolioPerformance, isLoading: performanceLoading } = portfolioManager.useGetPortfolioPerformance(address || "0x0");
  
  const isLoading = portfolioValueLoading || diversificationLoading || riskLoading || assetsLoading || performanceLoading;

  // Mock data for charts (in a real implementation, this would come from the contract or API)
  const performanceData = {
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

  const currentData = performanceData[timeframe];
  const currentValue = currentData[currentData.length - 1]?.value || 0;
  const previousValue = currentData[currentData.length - 2]?.value || 0;
  const change = currentValue - previousValue;
  const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;

  const allocationData = [
    { name: "Real Estate", value: 40, color: "#3B82F6" },
    { name: "Commodities", value: 25, color: "#10B981" },
    { name: "Infrastructure", value: 20, color: "#F59E0B" },
    { name: "Art & Collectibles", value: 10, color: "#EF4444" },
    { name: "Other", value: 5, color: "#8B5CF6" },
  ];

  const riskMetrics = [
    { label: "Volatility", value: "12.5%", status: "moderate" },
    { label: "Sharpe Ratio", value: "1.8", status: "good" },
    { label: "Max Drawdown", value: "8.2%", status: "low" },
    { label: "Beta", value: "0.85", status: "moderate" },
  ];

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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-white">
                {showBalance ? `$${currentValue.toLocaleString()}` : "••••••"}
              </div>
              <div className={`flex items-center gap-1 ${
                change >= 0 ? "text-green-400" : "text-red-400"
              }`}>
                {change >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {change >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Simple line chart representation */}
          <div className="h-48 bg-gray-800 rounded-lg p-4 flex items-end justify-between">
            {currentData.map((point, index) => {
              const height = ((point.value - Math.min(...currentData.map(d => d.value))) / 
                (Math.max(...currentData.map(d => d.value)) - Math.min(...currentData.map(d => d.value)))) * 100;
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
                    <span className="text-white font-medium">{asset.value}%</span>
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
                    <span className="text-white font-medium">{metric.value}</span>
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
                {showBalance ? `${diversificationScore ? Number(diversificationScore) : 85}%` : "••%"}
              </div>
              <div className="text-gray-300 text-sm">Diversification Score</div>
              <div className="text-xs text-gray-500 mt-1">Well diversified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">
                {showBalance ? `${riskScore ? Number(riskScore) / 100 : 7.2}/10` : "•••/10"}
              </div>
              <div className="text-gray-300 text-sm">Risk Score</div>
              <div className="text-xs text-gray-500 mt-1">Moderate risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-2">
                {showBalance ? "12.8%" : "••.•%"}
              </div>
              <div className="text-gray-300 text-sm">Annual Return</div>
              <div className="text-xs text-gray-500 mt-1">Above average</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}