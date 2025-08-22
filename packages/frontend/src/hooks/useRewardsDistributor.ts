import { useReadContract, useWriteContract } from "wagmi";
import { Address } from "viem";
import { CONTRACTS } from "@/config/contracts";
import RewardsDistributorABI from "@/lib/abis/RewardsDistributor.json";

/**
 * Hook for interacting with RewardsDistributor contract
 */
export function useRewardsDistributor() {
  const contractAddress = CONTRACTS.RewardsDistributor as Address;

  // Read functions
  const useGetUserRewards = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "getUserRewards",
      args: [user],
    });
  };

  const useGetClaimableRewards = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "getClaimableRewards",
      args: [user],
    });
  };

  const useGetRewardRate = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "getRewardRate",
      args: [asset],
    });
  };

  const useGetTotalRewardsDistributed = () => {
    return useReadContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "getTotalRewardsDistributed",
    });
  };

  const useGetUserStakedAmount = (user: Address, asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "getUserStakedAmount",
      args: [user, asset],
    });
  };

  const useGetRewardToken = () => {
    return useReadContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "getRewardToken",
    });
  };

  const useGetStakingPeriod = (user: Address, asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "getStakingPeriod",
      args: [user, asset],
    });
  };

  const useGetRewardMultiplier = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "getRewardMultiplier",
      args: [user],
    });
  };

  // Write contract hook
  const { writeContract, isPending, error } = useWriteContract();

  // Stake assets to earn rewards
  const stake = (asset: Address, amount: bigint) => {
    writeContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "stake",
      args: [asset, amount],
    });
  };

  // Unstake assets
  const unstake = (asset: Address, amount: bigint) => {
    writeContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "unstake",
      args: [asset, amount],
    });
  };

  // Claim accumulated rewards
  const claimRewards = () => {
    writeContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "claimRewards",
    });
  };

  // Claim rewards for specific asset
  const claimAssetRewards = (asset: Address) => {
    writeContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "claimAssetRewards",
      args: [asset],
    });
  };

  // Compound rewards (restake claimed rewards)
  const compoundRewards = (asset: Address) => {
    writeContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "compoundRewards",
      args: [asset],
    });
  };

  // Set reward rate (admin only)
  const setRewardRate = (asset: Address, rate: bigint) => {
    writeContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "setRewardRate",
      args: [asset, rate],
    });
  };

  // Add reward tokens to the pool (admin only)
  const addRewardTokens = (amount: bigint) => {
    writeContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "addRewardTokens",
      args: [amount],
    });
  };

  // Emergency withdraw (admin only)
  const emergencyWithdraw = (asset: Address, user: Address) => {
    writeContract({
      address: contractAddress,
      abi: RewardsDistributorABI,
      functionName: "emergencyWithdraw",
      args: [asset, user],
    });
  };

  return {
    // Read functions
    useGetUserRewards,
    useGetClaimableRewards,
    useGetRewardRate,
    useGetTotalRewardsDistributed,
    useGetUserStakedAmount,
    useGetRewardToken,
    useGetStakingPeriod,
    useGetRewardMultiplier,

    // Write functions
    stake,
    unstake,
    claimRewards,
    claimAssetRewards,
    compoundRewards,
    setRewardRate,
    addRewardTokens,
    emergencyWithdraw,
    isPending,
    error,

    // Contract info
    contractAddress,
  };
}
