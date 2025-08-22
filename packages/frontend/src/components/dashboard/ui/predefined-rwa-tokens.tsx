"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  MapPin,
  DollarSign,
  Coins,
  RefreshCw,
} from "lucide-react";
import { useRewardAssetFactory } from "@/hooks/useRewardAssetFactory";
import { Address } from "viem";

// Real deployed RWA asset addresses from CreateRewardAssets.s.sol deployment
const RWA_ASSET_ADDRESSES: Address[] = [
  "0xd3871a7653073f2c8e4ed9d8d798303586a44f55", // Gold Reserve Token (GOLD)
  "0xad95399b7dddf51145e7fd5735c865e474c5c010", // Premium Real Estate Fund (PREF)
  "0x91755aee9e26355aea0b102e48a46d0918490d4f", // Art Fund
  "0xf7be754c0efea6e0cdd5a511770996af4769e6d6", // Renewable Energy Credits (REC)
];

interface AssetInfo {
  name: string;
  symbol: string;
  assetType: number;
  totalSupply: bigint;
  pricePerToken: bigint;
  tokenAddress: Address;
  isActive: boolean;
  createdAt: bigint;
  creator: Address;
}

interface RWAAssetRowProps {
  assetAddress: Address;
}

function RWAAssetRow({ assetAddress }: RWAAssetRowProps) {
  const { useGetAssetInfo } = useRewardAssetFactory();
  const { data: assetInfo, isLoading, error } = useGetAssetInfo(assetAddress);

  const getAssetTypeLabel = (assetType: number) => {
    const types = {
      0: "Gold",
      1: "Silver",
      2: "Real Estate",
      3: "Art",
      4: "Oil",
      5: "Custom",
    };
    return types[assetType as keyof typeof types] || "Unknown";
  };

  const getAssetIcon = (assetType: number) => {
    const icons = {
      0: "/icons/gold.svg", // Gold
      1: "/icons/silver.svg", // Silver
      2: "/icons/real-estate.svg", // Real Estate
      3: "/icons/art.svg", // Art
      4: "/icons/energy.svg", // Oil/Energy
      5: "/icons/custom.svg", // Custom
    };
    const iconPath =
      icons[assetType as keyof typeof icons] || "/icons/custom.svg";
    return (
      <img
        src={iconPath}
        alt={getAssetTypeLabel(assetType)}
        className="w-6 h-6"
      />
    );
  };

  const [ethToUsd, setEthToUsd] = useState<number>(0);

  // Fetch ETH to USD conversion rate
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const data = await response.json();
        setEthToUsd(data.ethereum.usd);
      } catch (error) {
        console.error("Failed to fetch ETH price:", error);
        // Fallback to approximate ETH price if API fails
        setEthToUsd(2500);
      }
    };

    fetchEthPrice();
    // Refresh price every 5 minutes
    const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: bigint) => {
    const priceInEth = Number(price) / 1e18;
    const priceInUsd = priceInEth * ethToUsd;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(priceInUsd);
  };

  const formatSupply = (supply: bigint) => {
    return new Intl.NumberFormat("en-US").format(Number(supply) / 1e18);
  };

  const handleViewOnExplorer = () => {
    window.open(
      `https://sepolia.mantlescan.xyz/address/${assetAddress}`,
      "_blank"
    );
  };

  if (isLoading) {
    return (
      <tr className="border-b border-gray-800">
        <td colSpan={6} className="px-4 py-3">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Loading...</span>
          </div>
        </td>
      </tr>
    );
  }

  if (error || !assetInfo) {
    return (
      <tr className="border-b border-gray-800">
        <td colSpan={6} className="px-4 py-3 text-center text-red-400">
          Error loading asset info
        </td>
      </tr>
    );
  }

  const info = assetInfo as AssetInfo;

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8">
            {getAssetIcon(info.assetType)}
          </div>
          <div>
            <div className="font-semibold text-white">{info.name}</div>
            <div className="text-sm text-gray-400">{info.symbol}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
          {getAssetTypeLabel(info.assetType)}
        </span>
      </td>
      <td className="px-4 py-3 text-white">{formatSupply(info.totalSupply)}</td>
      <td className="px-4 py-3 text-green-400 font-medium">
        {formatPrice(info.pricePerToken)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-1 text-xs rounded ${
            info.isActive
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}
        >
          {info.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-400 hover:text-blue-300"
            onClick={handleViewOnExplorer}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-green-400 border-green-500/30 hover:bg-green-500/10"
          >
            Trade
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface PredefinedRWATokensProps {
  className?: string;
}

export function PredefinedRWATokens({ className }: PredefinedRWATokensProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            RWA Asset Information
          </CardTitle>
          <p className="text-sm text-gray-400 mt-1">
            Live data from deployed real-world asset tokens
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  Asset
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  Supply
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {RWA_ASSET_ADDRESSES.map((address) => (
                <RWAAssetRow key={address} assetAddress={address} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
