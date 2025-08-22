import { useReadContract, useWriteContract } from "wagmi";
import { Address } from "viem";
import { CONTRACTS } from "@/config/contracts";
import StrategyVaultABI from "@/lib/abis/StrategyVault.json";

/**
 * Hook for interacting with StrategyVault contract
 */
export function useStrategyVault() {
  const contractAddress = CONTRACTS.StrategyVault as Address;

  // Read functions
  const useGetVaultInfo = () => {
    return useReadContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "getVaultInfo",
    });
  };

  const useGetUserShares = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "getUserShares",
      args: [user],
    });
  };

  const useGetTotalAssets = () => {
    return useReadContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "getTotalAssets",
    });
  };

  const useGetTotalShares = () => {
    return useReadContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "getTotalShares",
    });
  };

  const useGetSharePrice = () => {
    return useReadContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "getSharePrice",
    });
  };

  const useGetUserValue = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "getUserValue",
      args: [user],
    });
  };

  const useGetVaultPerformance = () => {
    return useReadContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "getVaultPerformance",
    });
  };

  const useGetWithdrawalFee = () => {
    return useReadContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "getWithdrawalFee",
    });
  };

  const useGetManagementFee = () => {
    return useReadContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "getManagementFee",
    });
  };

  const useGetStrategyAllocation = () => {
    return useReadContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "getStrategyAllocation",
    });
  };

  // Write contract hook
  const { writeContract, isPending, error } = useWriteContract();

  // Deposit assets into vault
  const deposit = (amount: bigint, receiver?: Address) => {
    writeContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "deposit",
      args: [amount, receiver || "0x0000000000000000000000000000000000000000"],
    });
  };

  // Withdraw assets from vault
  const withdraw = (shares: bigint, receiver?: Address, owner?: Address) => {
    writeContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "withdraw",
      args: [
        shares,
        receiver || "0x0000000000000000000000000000000000000000",
        owner || "0x0000000000000000000000000000000000000000",
      ],
    });
  };

  // Redeem shares for assets
  const redeem = (shares: bigint, receiver?: Address, owner?: Address) => {
    writeContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "redeem",
      args: [
        shares,
        receiver || "0x0000000000000000000000000000000000000000",
        owner || "0x0000000000000000000000000000000000000000",
      ],
    });
  };

  // Execute strategy rebalancing
  const rebalance = () => {
    writeContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "rebalance",
    });
  };

  // Harvest strategy rewards
  const harvest = () => {
    writeContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "harvest",
    });
  };

  // Update strategy allocation (admin only)
  const updateAllocation = (strategies: Address[], allocations: number[]) => {
    writeContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "updateAllocation",
      args: [strategies, allocations],
    });
  };

  // Set withdrawal fee (admin only)
  const setWithdrawalFee = (fee: number) => {
    writeContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "setWithdrawalFee",
      args: [fee],
    });
  };

  // Set management fee (admin only)
  const setManagementFee = (fee: number) => {
    writeContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "setManagementFee",
      args: [fee],
    });
  };

  // Emergency pause (admin only)
  const pause = () => {
    writeContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "pause",
    });
  };

  // Unpause (admin only)
  const unpause = () => {
    writeContract({
      address: contractAddress,
      abi: StrategyVaultABI,
      functionName: "unpause",
    });
  };

  return {
    // Read functions
    useGetVaultInfo,
    useGetUserShares,
    useGetTotalAssets,
    useGetTotalShares,
    useGetSharePrice,
    useGetUserValue,
    useGetVaultPerformance,
    useGetWithdrawalFee,
    useGetManagementFee,
    useGetStrategyAllocation,

    // Write functions
    deposit,
    withdraw,
    redeem,
    rebalance,
    harvest,
    updateAllocation,
    setWithdrawalFee,
    setManagementFee,
    pause,
    unpause,
    isPending,
    error,

    // Contract info
    contractAddress,
  };
}
