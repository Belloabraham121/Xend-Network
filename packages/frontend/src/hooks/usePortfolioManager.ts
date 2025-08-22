import { useReadContract, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { Address } from "viem";
import { CONTRACTS } from "@/config/contracts";
import PortfolioManagerABI from "@/lib/abis/PortfolioManager.json";

/**
 * Hook for interacting with PortfolioManager contract
 */
export function usePortfolioManager() {
  const contractAddress = CONTRACTS.PortfolioManager as Address;
  const queryClient = useQueryClient();

  // Helper function to invalidate all portfolio-related queries
  const invalidatePortfolioQueries = (userAddress?: Address) => {
    // Invalidate all queries related to portfolio data
    queryClient.invalidateQueries({ queryKey: ["readContract"] });

    // If we have a specific user address, we could be more specific
    if (userAddress) {
      queryClient.invalidateQueries({
        queryKey: [
          "readContract",
          {
            address: contractAddress,
            functionName: "getUserPortfolio",
            args: [userAddress],
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "readContract",
          {
            address: contractAddress,
            functionName: "getPortfolioValue",
            args: [userAddress],
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "readContract",
          {
            address: contractAddress,
            functionName: "getUserAssets",
            args: [userAddress],
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "readContract",
          {
            address: contractAddress,
            functionName: "getPortfolioPerformance",
            args: [userAddress],
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "readContract",
          {
            address: contractAddress,
            functionName: "getDiversificationScore",
            args: [userAddress],
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "readContract",
          {
            address: contractAddress,
            functionName: "getRiskScore",
            args: [userAddress],
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "readContract",
          {
            address: contractAddress,
            functionName: "getPerformanceHistory",
            args: [userAddress],
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "readContract",
          {
            address: contractAddress,
            functionName: "userHasPortfolio",
            args: [userAddress],
          },
        ],
      });
    }
  };

  // Read functions
  const useGetUserPortfolio = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "getUserPortfolio",
      args: [user],
    });
  };

  const useGetPortfolioValue = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "getPortfolioValue",
      args: [user],
    });
  };

  const useGetAssetAllocation = (user: Address, asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "getAssetAllocation",
      args: [user, asset],
    });
  };

  const useGetUserAssets = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "getUserAssets",
      args: [user],
    });
  };

  const useGetAssetBalance = (user: Address, asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "getAssetBalance",
      args: [user, asset],
    });
  };

  const useGetPortfolioPerformance = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "getPortfolioPerformance",
      args: [user],
    });
  };

  const useGetDiversificationScore = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "getDiversificationScore",
      args: [user],
    });
  };

  const useGetRiskScore = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "getRiskScore",
      args: [user],
    });
  };

  const useCalculateRiskScore = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "calculateRiskScore",
      args: [user],
    });
  };

  const useUserHasPortfolio = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "userHasPortfolio",
      args: [user],
    });
  };

  const useGetAssetAllocationByType = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "getAssetAllocation",
      args: [user],
    });
  };

  const useGetPerformanceHistory = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "getPerformanceHistory",
      args: [user],
    });
  };

  const useGetUserPositions = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "getUserPositions",
      args: [user],
    });
  };

  const useGetActivePositions = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "getActivePositions",
      args: [user],
    });
  };

  // Write contract hook with success callback
  const { writeContract, isPending, error } = useWriteContract({
    mutation: {
      onSuccess: () => {
        // Invalidate all portfolio queries when any write operation succeeds
        invalidatePortfolioQueries();
      },
    },
  });

  // Add position to portfolio
  const addPosition = (
    user: Address,
    asset: Address,
    amount: bigint,
    averagePrice: bigint
  ) => {
    writeContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "addPosition",
      args: [user, asset, amount, averagePrice],
    });
  };

  // Update position in portfolio
  const updatePosition = (
    user: Address,
    asset: Address,
    newAmount: bigint,
    newAveragePrice: bigint
  ) => {
    writeContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "updatePosition",
      args: [user, asset, newAmount, newAveragePrice],
    });
  };

  // Remove position from portfolio
  const removePosition = (user: Address, asset: Address) => {
    writeContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "removePosition",
      args: [user, asset],
    });
  };

  // Rebalance portfolio (original function with target allocations)
  const rebalancePortfolio = (
    targetAllocations: Address[],
    targetPercentages: number[]
  ) => {
    writeContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "rebalancePortfolio",
      args: [targetAllocations, targetPercentages],
    });
  };

  // Rebalance portfolio for a specific user (from smart contract)
  const rebalanceUserPortfolio = (user: Address) => {
    writeContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "rebalancePortfolio",
      args: [user],
    });
  };

  // Set asset allocation target
  const setAllocationTarget = (asset: Address, targetPercentage: number) => {
    writeContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "setAllocationTarget",
      args: [asset, targetPercentage],
    });
  };

  // Update portfolio strategy
  const updateStrategy = (strategyType: number, parameters: bigint[]) => {
    writeContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "updateStrategy",
      args: [strategyType, parameters],
    });
  };

  // Execute portfolio rebalancing
  const executeRebalancing = () => {
    writeContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "executeRebalancing",
    });
  };

  // Set risk tolerance
  const setRiskTolerance = (riskLevel: number) => {
    writeContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "setRiskTolerance",
      args: [riskLevel],
    });
  };

  // Take performance snapshot
  const takePerformanceSnapshot = (user: Address) => {
    writeContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "takePerformanceSnapshot",
      args: [user],
    });
  };

  return {
    // Read functions
    useGetUserPortfolio,
    useGetPortfolioValue,
    useGetAssetAllocation,
    useGetUserAssets,
    useGetAssetBalance,
    useGetPortfolioPerformance,
    useGetDiversificationScore,
    useGetRiskScore,
    useCalculateRiskScore,
    useUserHasPortfolio,
    useGetAssetAllocationByType,
    useGetPerformanceHistory,
    useGetUserPositions,
    useGetActivePositions,

    // Write functions
    addPosition,
    updatePosition,
    removePosition,
    rebalancePortfolio,
    rebalanceUserPortfolio,
    setAllocationTarget,
    updateStrategy,
    executeRebalancing,
    setRiskTolerance,
    takePerformanceSnapshot,
    isPending,
    error,

    // Utility functions
    invalidatePortfolioQueries,

    // Contract info
    contractAddress,
  };
}
