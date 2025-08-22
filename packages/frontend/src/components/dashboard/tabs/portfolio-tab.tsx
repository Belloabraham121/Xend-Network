"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortfolioOverview } from "../ui/portfolio-overview";
import { ActivePositions } from "../ui/active-positions";
import { PortfolioManagement } from "../ui/portfolio-management";
import { PortfolioAnalytics } from "../ui/portfolio-analytics";

export function PortfolioTab() {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="space-y-8">
      {/* Portfolio Overview Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Portfolio Overview</h2>
            <p className="text-gray-400">Real-time insights into your RWA portfolio performance</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBalance(!showBalance)}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            {showBalance ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Balances
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Balances
              </>
            )}
          </Button>
        </div>
        
        <PortfolioOverview 
          showBalance={showBalance} 
          onToggleBalance={() => setShowBalance(!showBalance)} 
        />
      </div>

      {/* Active Positions Section */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Active Positions</h2>
          <p className="text-gray-400">Manage your current RWA token holdings</p>
        </div>
        
        <ActivePositions showBalance={showBalance} />
      </div>

      {/* Portfolio Management Section */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Portfolio Management</h2>
          <p className="text-gray-400">Advanced portfolio optimization and risk management tools</p>
        </div>
        
        <PortfolioManagement showBalance={showBalance} />
      </div>

      {/* Portfolio Analytics Section */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Portfolio Analytics</h2>
          <p className="text-gray-400">Detailed performance metrics and insights</p>
        </div>
        
        <PortfolioAnalytics showBalance={showBalance} />
      </div>
    </div>
  );
}