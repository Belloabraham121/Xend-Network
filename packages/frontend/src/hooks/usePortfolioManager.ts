import { useReadContract, useWriteContract } from "wagmi";
import { Address } from "viem";
import { CONTRACTS } from "@/config/contracts";
import PortfolioManagerABI from "@/lib/abis/PortfolioManager.json";

/**
 * Hook for interacting with PortfolioManager contract
 */
export function usePortfolioManager() {
  const contractAddress = CONTRACTS.PortfolioManager as Address;

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

  // Write contract hook
  const { writeContract, isPending, error } = useWriteContract();

  // Add asset to portfolio
  const addAsset = (asset: Address, amount: bigint) => {
    writeContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "addAsset",
      args: [asset, amount],
    });
  };

  // Remove asset from portfolio
  const removeAsset = (asset: Address, amount: bigint) => {
    writeContract({
      address: contractAddress,
      abi: PortfolioManagerABI,
      functionName: "removeAsset",
      args: [asset, amount],
    });
  };

  // Rebalance portfolio
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

    // Write functions
    addAsset,
    removeAsset,
    rebalancePortfolio,
    setAllocationTarget,
    updateStrategy,
    executeRebalancing,
    setRiskTolerance,
    isPending,
    error,

    // Contract info
    contractAddress,
  };
}
