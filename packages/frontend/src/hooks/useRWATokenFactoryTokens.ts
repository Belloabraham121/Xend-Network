import { useReadContract } from "wagmi";
import { Address } from "viem";
import { CONTRACTS } from "@/config/contracts";
import RewardAssetFactoryABI from "@/lib/abis/RewardAssetFactory.json";

/**
 * Hook for getting RWA token information from RewardAssetFactory
 */
export function useRWATokenFactoryTokens() {
  const contractAddress = CONTRACTS.RewardAssetFactory as Address;

  // Get total number of assets
  const { data: assetCount } = useReadContract({
    address: contractAddress,
    abi: RewardAssetFactoryABI,
    functionName: "getAssetCount",
  });

  // Get asset by index
  const useGetAssetByIndex = (index: number) => {
    return useReadContract({
      address: contractAddress,
      abi: RewardAssetFactoryABI,
      functionName: "getAssetByIndex",
      args: [index],
    });
  };

  // Get asset info
  const useGetAssetInfo = (assetAddress: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: RewardAssetFactoryABI,
      functionName: "getAssetInfo",
      args: [assetAddress],
    });
  };

  // Get all token addresses
  const getTokenAddresses = (): Address[] => {
    if (!assetCount || typeof assetCount !== "number") return [];

    const addresses: Address[] = [];
    for (let i = 0; i < assetCount; i++) {
      // This would need to be implemented with proper async handling
      // For now, return empty array
    }
    return addresses;
  };

  return {
    assetCount,
    useGetAssetByIndex,
    useGetAssetInfo,
    getTokenAddresses,
    contractAddress,
  };
}
