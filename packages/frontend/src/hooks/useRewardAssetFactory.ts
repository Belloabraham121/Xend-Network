import { useReadContract, useWriteContract } from "wagmi";
import { Address } from "viem";
import { CONTRACTS } from "@/config/contracts";
import RewardAssetFactoryABI from "@/lib/abis/RewardAssetFactory.json";

/**
 * Hook for interacting with RewardAssetFactory contract
 */
export function useRewardAssetFactory() {
  const contractAddress = CONTRACTS.RewardAssetFactory as Address;

  // Read functions
  const useGetAssetCount = () => {
    return useReadContract({
      address: contractAddress,
      abi: RewardAssetFactoryABI,
      functionName: "getAssetCount",
    });
  };

  const useGetAssetByIndex = (index: number) => {
    return useReadContract({
      address: contractAddress,
      abi: RewardAssetFactoryABI,
      functionName: "getAssetByIndex",
      args: [index],
    });
  };

  const useGetAssetInfo = (assetAddress: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: RewardAssetFactoryABI,
      functionName: "getAssetInfo",
      args: [assetAddress],
    });
  };

  const useIsAssetRegistered = (assetAddress: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: RewardAssetFactoryABI,
      functionName: "isAssetRegistered",
      args: [assetAddress],
    });
  };

  // Write contract hook
  const { writeContract, isPending, error } = useWriteContract();

  // Create new RWA token
  const createRWAToken = (
    name: string,
    symbol: string,
    initialSupply: bigint,
    assetType: string,
    metadata: string
  ) => {
    writeContract({
      address: contractAddress,
      abi: RewardAssetFactoryABI,
      functionName: "createRWAToken",
      args: [name, symbol, initialSupply, assetType, metadata],
    });
  };

  // Register existing asset
  const registerAsset = (
    assetAddress: Address,
    assetType: string,
    metadata: string
  ) => {
    writeContract({
      address: contractAddress,
      abi: RewardAssetFactoryABI,
      functionName: "registerAsset",
      args: [assetAddress, assetType, metadata],
    });
  };

  // Update asset metadata (admin only)
  const updateAssetMetadata = (assetAddress: Address, metadata: string) => {
    writeContract({
      address: contractAddress,
      abi: RewardAssetFactoryABI,
      functionName: "updateAssetMetadata",
      args: [assetAddress, metadata],
    });
  };

  return {
    // Read functions
    useGetAssetCount,
    useGetAssetByIndex,
    useGetAssetInfo,
    useIsAssetRegistered,

    // Write functions
    createRWAToken,
    registerAsset,
    updateAssetMetadata,
    isPending,
    error,

    // Contract info
    contractAddress,
  };
}
