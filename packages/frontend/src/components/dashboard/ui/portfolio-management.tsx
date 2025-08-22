"use client";

import { useState } from "react";
import { Shuffle, Target, Settings, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Using native range input instead of Slider component
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAccount } from "wagmi";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";
import { formatEther } from "viem";
import { toast } from "sonner";

interface PortfolioManagementProps {
  showBalance: boolean;
}

interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAssets: `0x${string}`[];
}

function RebalanceModal({ isOpen, onClose, userAssets }: RebalanceModalProps) {
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const { rebalancePortfolio, isPending } = usePortfolioManager();
  
  const handleAllocationChange = (asset: string, value: number) => {
    setAllocations(prev => ({ ...prev, [asset]: value }));
  };
  
  const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  
  const handleRebalance = () => {
    if (totalAllocation !== 100) {
      toast.error("Total allocation must equal 100%");
      return;
    }
    
    const targetAllocations = userAssets;
    const targetPercentages = userAssets.map(asset => allocations[asset] || 0);
    
    try {
      rebalancePortfolio(targetAllocations, targetPercentages);
      toast.success("Portfolio rebalanced successfully!");
      onClose();
    } catch (error) {
      console.error("Error rebalancing portfolio:", error);
      toast.error("Error rebalancing portfolio. Please try again.");
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Rebalance Portfolio</DialogTitle>
          <DialogDescription className="text-gray-400">
            Adjust your asset allocations to optimize your portfolio balance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {userAssets.map((asset, index) => {
            const currentAllocation = allocations[asset] || 0;
            return (
              <div key={asset} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-white">Asset {index + 1}</Label>
                  <span className="text-sm text-gray-400">{currentAllocation}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={currentAllocation}
                  onChange={(e) => handleAllocationChange(asset, Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            );
          })}
          
          <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
            <span className="text-white font-medium">Total Allocation:</span>
            <span className={`font-bold ${
              totalAllocation === 100 ? 'text-green-400' : 'text-red-400'
            }`}>
              {totalAllocation}%
            </span>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex-1 border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRebalance}
              disabled={totalAllocation !== 100 || isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isPending ? 'Rebalancing...' : 'Rebalance Portfolio'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RiskManagement() {
  const [riskTolerance, setRiskTolerance] = useState([50]);
  const { setRiskTolerance: updateRiskTolerance, isPending } = usePortfolioManager();
  
  const handleRiskUpdate = () => {
    try {
      updateRiskTolerance(riskTolerance[0]);
      toast.success("Risk tolerance updated successfully!");
    } catch (error) {
      console.error("Error updating risk tolerance:", error);
      toast.error("Error updating risk tolerance. Please try again.");
    }
  };
  
  const getRiskLabel = (value: number) => {
    if (value <= 30) return { label: "Conservative", color: "text-green-400" };
    if (value <= 70) return { label: "Moderate", color: "text-yellow-400" };
    return { label: "Aggressive", color: "text-red-400" };
  };
  
  const riskInfo = getRiskLabel(riskTolerance[0]);
  
  return (
    <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-400" />
          Risk Management
        </CardTitle>
        <p className="text-gray-400">Configure your risk tolerance and investment strategy</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-white">Risk Tolerance</Label>
            <span className={`font-medium ${riskInfo.color}`}>
              {riskInfo.label} ({riskTolerance[0]}%)
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={riskTolerance[0]}
            onChange={(e) => setRiskTolerance([Number(e.target.value)])}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Conservative</span>
            <span>Moderate</span>
            <span>Aggressive</span>
          </div>
        </div>
        
        <Button 
          onClick={handleRiskUpdate}
          disabled={isPending}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {isPending ? 'Updating...' : 'Update Risk Tolerance'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function PortfolioManagement({ showBalance }: PortfolioManagementProps) {
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const { address: userAddress } = useAccount();
  const { 
    useGetUserAssets, 
    useGetPortfolioValue, 
    useGetRiskScore,
    useCalculateRiskScore,
    executeRebalancing,
    rebalanceUserPortfolio,
    isPending 
  } = usePortfolioManager();
  
  const userAssets = useGetUserAssets(userAddress as `0x${string}`);
  const portfolioValue = useGetPortfolioValue(userAddress as `0x${string}`);
  const riskScore = useGetRiskScore(userAddress as `0x${string}`);
  const calculatedRiskScore = useCalculateRiskScore(userAddress as `0x${string}`);
  
  const assets = userAssets.data as `0x${string}`[] || [];
  const totalValue = portfolioValue.data ? Number(formatEther(portfolioValue.data as bigint)) : 0;
  const storedRisk = riskScore.data ? Number(riskScore.data) : 0;
  const calculatedRisk = calculatedRiskScore.data ? Number(calculatedRiskScore.data) : 0;
  const currentRisk = calculatedRisk > 0 ? calculatedRisk : storedRisk;
  
  const handleAutoRebalance = () => {
    try {
      executeRebalancing();
      toast.success("Auto rebalancing initiated successfully!");
    } catch (error) {
      console.error("Error executing auto rebalance:", error);
      toast.error("Error executing auto rebalance. Please try again.");
    }
  };

  const handleSmartRebalance = () => {
    if (!userAddress) {
      toast.error("Please connect your wallet");
      return;
    }
    
    try {
      rebalanceUserPortfolio(userAddress as `0x${string}`);
      toast.success("Smart rebalancing initiated successfully!");
    } catch (error) {
      console.error("Error executing smart rebalance:", error);
      toast.error("Error executing smart rebalance. Please try again.");
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Portfolio Actions */}
      <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-400" />
            Portfolio Management
          </CardTitle>
          <p className="text-gray-400">Manage and optimize your portfolio allocation</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <h4 className="font-semibold text-white mb-2">Portfolio Value</h4>
              <p className="text-2xl font-bold text-green-400">
                {showBalance ? `$${totalValue.toFixed(2)}` : "••••••"}
              </p>
              <p className="text-sm text-gray-400 mt-1">{assets.length} positions</p>
            </div>
            
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <h4 className="font-semibold text-white mb-2">Risk Score</h4>
              <p className="text-2xl font-bold text-orange-400">{currentRisk}/100</p>
              <p className="text-sm text-gray-400 mt-1">
                {currentRisk <= 30 ? 'Low Risk' : currentRisk <= 70 ? 'Medium Risk' : 'High Risk'}
              </p>
            </div>
            
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <h4 className="font-semibold text-white mb-2">Rebalancing</h4>
              <p className="text-sm text-gray-400 mb-3">Optimize allocation</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => setIsRebalanceOpen(true)}
                  disabled={assets.length === 0}
                  variant="outline"
                  size="sm"
                  className="w-full border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Manual Rebalance
                </Button>
                <Button 
                  onClick={handleAutoRebalance}
                  disabled={assets.length === 0 || isPending}
                  size="sm"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {isPending ? 'Processing...' : 'Auto Rebalance'}
                </Button>
                <Button 
                  onClick={handleSmartRebalance}
                  disabled={assets.length === 0 || isPending || currentRisk <= 70}
                  size="sm"
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                  title={currentRisk <= 70 ? 'Smart rebalance only triggers for high-risk portfolios (>70)' : 'Rebalance based on current risk assessment'}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {isPending ? 'Processing...' : 'Smart Rebalance'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Risk Management */}
      <RiskManagement />
      
      {/* Rebalance Modal */}
      <RebalanceModal 
        isOpen={isRebalanceOpen}
        onClose={() => setIsRebalanceOpen(false)}
        userAssets={assets}
      />
    </div>
  );
}