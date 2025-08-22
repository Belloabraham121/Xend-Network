import { useReadContract, useWriteContract } from "wagmi";
import { Address } from "viem";
import { CONTRACTS } from "@/config/contracts";
import ChainlinkPriceOracleABI from "@/lib/abis/ChainlinkPriceOracle.json";

/**
 * Hook for reading from ChainlinkPriceOracle contract
 */
export function useChainlinkPriceOracle() {
  const contractAddress = CONTRACTS.ChainlinkPriceOracle as Address;

  // Read the latest price for an asset
  const useGetLatestPrice = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: ChainlinkPriceOracleABI,
      functionName: "getLatestPrice",
      args: [asset],
    });
  };

  // Read price feed address for an asset
  const useGetPriceFeed = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: ChainlinkPriceOracleABI,
      functionName: "getPriceFeed",
      args: [asset],
    });
  };

  // Read if price feed is supported
  const useIsPriceFeedSupported = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: ChainlinkPriceOracleABI,
      functionName: "isPriceFeedSupported",
      args: [asset],
    });
  };

  // Write contract hook
  const { writeContract, isPending, error } = useWriteContract();

  // Set price feed for an asset (admin only)
  const setPriceFeed = (asset: Address, priceFeed: Address) => {
    writeContract({
      address: contractAddress,
      abi: ChainlinkPriceOracleABI,
      functionName: "setPriceFeed",
      args: [asset, priceFeed],
    });
  };

  return {
    // Read functions
    useGetLatestPrice,
    useGetPriceFeed,
    useIsPriceFeedSupported,

    // Write functions
    setPriceFeed,
    isPending,
    error,

    // Contract info
    contractAddress,
  };
}
