import { useReadContract, useWriteContract } from "wagmi";
import { Address } from "viem";
import { CONTRACTS } from "@/config/contracts";
import AssetMarketplaceABI from "@/lib/abis/AssetMarketplace.json";

/**
 * Hook for interacting with AssetMarketplace contract
 */
export function useAssetMarketplace() {
  const contractAddress = CONTRACTS.AssetMarketplace as Address;

  // Read functions
  const useGetListing = (listingId: bigint) => {
    return useReadContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "getListing",
      args: [listingId],
    });
  };

  const useGetActiveListings = () => {
    return useReadContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "getActiveListings",
    });
  };

  const useGetUserListings = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "getUserListings",
      args: [user],
    });
  };

  const useGetListingsByAsset = (assetAddress: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "getListingsByAsset",
      args: [assetAddress],
    });
  };

  const useIsListingActive = (listingId: bigint) => {
    return useReadContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "isListingActive",
      args: [listingId],
    });
  };

  const useGetMarketplaceFee = () => {
    return useReadContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "getMarketplaceFee",
    });
  };

  const useGetTotalListings = () => {
    return useReadContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "getTotalListings",
    });
  };

  // Write contract hook
  const { writeContract, isPending, error } = useWriteContract();

  // Create a new listing
  const createListing = (
    assetAddress: Address,
    tokenId: bigint,
    price: bigint,
    paymentToken: Address,
    duration: bigint
  ) => {
    writeContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "createListing",
      args: [assetAddress, tokenId, price, paymentToken, duration],
    });
  };

  // Purchase a listing
  const purchaseListing = (listingId: bigint) => {
    writeContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "purchaseListing",
      args: [listingId],
    });
  };

  // Cancel a listing
  const cancelListing = (listingId: bigint) => {
    writeContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "cancelListing",
      args: [listingId],
    });
  };

  // Update listing price
  const updateListingPrice = (listingId: bigint, newPrice: bigint) => {
    writeContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "updateListingPrice",
      args: [listingId, newPrice],
    });
  };

  // Make an offer on a listing
  const makeOffer = (
    listingId: bigint,
    offerAmount: bigint,
    paymentToken: Address
  ) => {
    writeContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "makeOffer",
      args: [listingId, offerAmount, paymentToken],
    });
  };

  // Accept an offer
  const acceptOffer = (listingId: bigint, offerId: bigint) => {
    writeContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "acceptOffer",
      args: [listingId, offerId],
    });
  };

  // Withdraw offer
  const withdrawOffer = (listingId: bigint, offerId: bigint) => {
    writeContract({
      address: contractAddress,
      abi: AssetMarketplaceABI,
      functionName: "withdrawOffer",
      args: [listingId, offerId],
    });
  };

  return {
    // Read functions
    useGetListing,
    useGetActiveListings,
    useGetUserListings,
    useGetListingsByAsset,
    useIsListingActive,
    useGetMarketplaceFee,
    useGetTotalListings,

    // Write functions
    createListing,
    purchaseListing,
    cancelListing,
    updateListingPrice,
    makeOffer,
    acceptOffer,
    withdrawOffer,
    isPending,
    error,

    // Contract info
    contractAddress,
  };
}
