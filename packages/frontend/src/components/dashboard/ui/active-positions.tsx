"use client";

import { useState } from "react";
import {
  Plus,
  Minus,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccount } from "wagmi";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";
import { useRewardAssetFactory } from "@/hooks/useRewardAssetFactory";
import { formatEther, parseEther } from "viem";
import { toast } from "sonner";

interface ActivePositionsProps {
  showBalance: boolean;
}

interface Position {
  tokenAddress: string;
  amount: bigint;
  value: bigint;
  entryPrice: bigint;
  currentPrice: bigint;
  lastUpdated: bigint;
  isActive: boolean;
}

interface ContractAssetInfo {
  name: string;
  symbol: string;
  assetType: number;
  pricePerToken: bigint;
  totalSupply: bigint;
  isActive: boolean;
}

interface PositionItemProps {
  position: Position;
  showBalance: boolean;
  onAddPosition: (asset: `0x${string}`) => void;
  onRemovePosition: (asset: `0x${string}`) => void;
}

function PositionItem({
  position,
  showBalance,
  onAddPosition,
  onRemovePosition,
}: PositionItemProps) {
  const { useGetAssetInfo } = useRewardAssetFactory();
  const { data: contractAssetInfo, isLoading } = useGetAssetInfo(position.tokenAddress as `0x${string}`);

  const balance = Number(formatEther(position.amount));
  const positionValue = Number(formatEther(position.value));
  const entryPrice = Number(formatEther(position.entryPrice));
  const currentPrice = Number(formatEther(position.currentPrice));

  // Calculate price change percentage
  const priceChange = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
  const isPositive = priceChange > 0;

  // Get asset type icon and info
  const getAssetTypeInfo = (assetType: number) => {
    const types = {
      0: { name: "Gold", icon: "🥇" },
      1: { name: "Silver", icon: "🥈" },
      2: { name: "Real Estate", icon: "🏠" },
      3: { name: "Art", icon: "🎨" },
      4: { name: "Oil", icon: "🛢️" },
      5: { name: "Custom", icon: "❓" },
    };
    return types[assetType as keyof typeof types] || { name: "Unknown", icon: "❓" };
  };

  // Use contract data if available, otherwise fallback to loading state
  const assetInfo = contractAssetInfo ? {
    name: (contractAssetInfo as ContractAssetInfo).name,
    symbol: (contractAssetInfo as ContractAssetInfo).symbol,
    type: getAssetTypeInfo((contractAssetInfo as ContractAssetInfo).assetType).name,
    icon: getAssetTypeInfo((contractAssetInfo as ContractAssetInfo).assetType).icon,
    price: Number(formatEther((contractAssetInfo as ContractAssetInfo).pricePerToken))
  } : {
    name: isLoading ? "Loading..." : "Unknown Asset",
    symbol: isLoading ? "..." : "UNK",
    type: "Unknown",
    icon: "❓",
    price: 0
  };

  const allocation = 25; // Mock allocation percentage - could be calculated from portfolio total

  return (
    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-white text-lg">
              {assetInfo.name}
            </h4>
            <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">
              {assetInfo.type}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Balance</p>
              <p className="text-white font-medium">
                {showBalance
                  ? `${balance.toFixed(4)} ${assetInfo.symbol}`
                  : "••••••"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Value (USD)</p>
              <p className="text-green-400 font-medium">
                {showBalance ? `$${positionValue.toFixed(2)}` : "••••••"}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Allocation</p>
              <p className="text-blue-400 font-medium">
                {allocation.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-gray-400">24h Change</p>
              <div className="flex items-center gap-1">
                {priceChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <p
                  className={`font-medium ${
                    priceChange >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {priceChange >= 0 ? "+" : ""}
                  {priceChange.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 text-gray-400 hover:text-white">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-900 border-gray-700">
            <DropdownMenuItem
              onClick={() => onAddPosition(position.tokenAddress as `0x${string}`)}
              className="text-green-400 hover:text-green-300 hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Position
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRemovePosition(position.tokenAddress as `0x${string}`)}
              className="text-red-400 hover:text-red-300 hover:bg-gray-800"
            >
              <Minus className="h-4 w-4 mr-2" />
              Remove Position
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function ActivePositions({ showBalance }: ActivePositionsProps) {
  const { address: userAddress } = useAccount();
  const { useGetActivePositions, addPosition, removePosition, isPending } =
    usePortfolioManager();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPosition, setNewPosition] = useState({
    asset: "",
    amount: "",
    averagePrice: "",
  });
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);

  // Predefined RWA asset addresses
  const RWA_ASSETS = [
    {
      address: "0xd3871a7653073f2c8e4ed9d8d798303586a44f55",
      name: "Gold Reserve Token",
      symbol: "GOLD",
    },
    {
      address: "0xad95399b7dddf51145e7fd5735c865e474c5c010",
      name: "Premium Real Estate Fund",
      symbol: "PREF",
    },
    {
      address: "0x91755aee9e26355aea0b102e48a46d0918490d4f",
      name: "Art Fund",
      symbol: "ART",
    },
    {
      address: "0xf7be754c0efea6e0cdd5a511770996af4769e6d6",
      name: "Renewable Energy Credits",
      symbol: "REC",
    },
  ];

  const activePositions = useGetActivePositions(userAddress as `0x${string}`);
  const positions = (activePositions.data as Position[]) || [];



  const handleAddPosition = (assetAddress?: `0x${string}`) => {
    if (assetAddress && userAddress) {
      // Quick add for existing positions
      const amount = BigInt("1000000000000000000"); // 1 token in wei
      const averagePrice = BigInt("1000000000000000000"); // 1 ETH in wei
      addPosition(userAddress, assetAddress, amount, averagePrice);
      toast.success("Position added successfully!");
    } else {
      // Show modal for new positions
      setShowAddModal(true);
    }
  };

  const handleSubmitPosition = () => {
    if (
      !userAddress ||
      !newPosition.asset ||
      !newPosition.amount ||
      !newPosition.averagePrice
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const amount = parseEther(newPosition.amount);
      const averagePrice = parseEther(newPosition.averagePrice);

      // Use addPosition from the hook which calls the smart contract
      addPosition(
        userAddress,
        newPosition.asset as `0x${string}`,
        amount,
        averagePrice
      );

      // Reset form and close modal
      setNewPosition({ asset: "", amount: "", averagePrice: "" });
      setShowAddModal(false);
      setShowAssetDropdown(false);
      toast.success("Position added successfully!");
    } catch (error) {
      console.error("Error adding position:", error);
      toast.error("Error adding position. Please check your inputs.");
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewPosition({ asset: "", amount: "", averagePrice: "" });
    setShowAssetDropdown(false);
  };

  const handleAssetSelect = (asset: (typeof RWA_ASSETS)[0]) => {
    setNewPosition({ ...newPosition, asset: asset.address });
    setShowAssetDropdown(false);
  };

  const getSelectedAssetName = () => {
    const selected = RWA_ASSETS.find(
      (asset) => asset.address === newPosition.asset
    );
    return selected
      ? `${selected.name} (${selected.symbol})`
      : "Select an asset";
  };

  const handleRemovePosition = (assetAddress: `0x${string}`) => {
    if (!userAddress) {
      toast.error("Please connect your wallet");
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to remove this position? This action cannot be undone."
    );

    if (confirmed) {
      try {
        // Use removePosition function which matches the smart contract
        removePosition(userAddress, assetAddress);
        toast.success("Position removed successfully!");
      } catch (error) {
        console.error("Error removing position:", error);
        toast.error("Error removing position. Please try again.");
      }
    }
  };

  return (
    <Card className="bg-gray-950/80 backdrop-blur-sm border-gray-800">
      <CardHeader className="pb-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold text-white">
              Active Positions
            </CardTitle>
            <p className="text-gray-400 mt-1">
              Your current portfolio holdings
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-green-500/20 text-green-400 hover:bg-green-500/10"
            disabled={isPending}
            onClick={() => handleAddPosition()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Position
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.length > 0 ? (
            positions.map((position, index) => (
              <PositionItem
                key={`${position.tokenAddress}-${index}`}
                position={position}
                showBalance={showBalance}
                onAddPosition={handleAddPosition}
                onRemovePosition={handleRemovePosition}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No Active Positions
              </h3>
              <p className="text-gray-400 mb-4">
                Start building your RWA portfolio by adding your first position.
              </p>
              <Button
                variant="outline"
                className="border-green-500/20 text-green-400 hover:bg-green-500/10"
                onClick={() => handleAddPosition()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Position
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Add Position Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Add New Position
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Asset
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAssetDropdown(!showAssetDropdown)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                  >
                    <span
                      className={
                        newPosition.asset ? "text-white" : "text-gray-400"
                      }
                    >
                      {getSelectedAssetName()}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>

                  {showAssetDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
                      {RWA_ASSETS.map((asset) => (
                        <button
                          key={asset.address}
                          type="button"
                          onClick={() => handleAssetSelect(asset)}
                          className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 first:rounded-t-md last:rounded-b-md"
                        >
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-sm text-gray-400">
                            {asset.symbol} • {asset.address.slice(0, 8)}...
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Amount
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={newPosition.amount}
                  onChange={(e) =>
                    setNewPosition({ ...newPosition, amount: e.target.value })
                  }
                  placeholder="0.0"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Average Price (ETH per token)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={newPosition.averagePrice}
                  onChange={(e) =>
                    setNewPosition({
                      ...newPosition,
                      averagePrice: e.target.value,
                    })
                  }
                  placeholder="0.0"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitPosition}
                disabled={isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isPending ? "Adding..." : "Add Position"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
