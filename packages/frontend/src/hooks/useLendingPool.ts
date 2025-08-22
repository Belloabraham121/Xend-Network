import { useReadContract, useWriteContract } from "wagmi";
import { Address } from "viem";
import { CONTRACTS } from "@/config/contracts";
import LendingPoolABI from "@/lib/abis/LendingPool.json";

/**
 * Hook for interacting with LendingPool contract
 */
export function useLendingPool() {
  const contractAddress = CONTRACTS.LendingPool as Address;

  // Read functions
  const useGetUserAccountData = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getUserAccountData",
      args: [user],
    });
  };

  const useGetReserveData = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getReserveData",
      args: [asset],
    });
  };

  const useGetUserReserveData = (asset: Address, user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getUserReserveData",
      args: [asset, user],
    });
  };

  const useGetReservesList = () => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getReservesList",
    });
  };

  const useGetLiquidationThreshold = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getLiquidationThreshold",
      args: [asset],
    });
  };

  const useGetHealthFactor = (user: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getHealthFactor",
      args: [user],
    });
  };

  // Write contract hook
  const { writeContract, isPending, error } = useWriteContract();

  // Deposit assets
  const deposit = (asset: Address, amount: bigint, onBehalfOf?: Address) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "deposit",
      args: [
        asset,
        amount,
        onBehalfOf || "0x0000000000000000000000000000000000000000",
      ],
    });
  };

  // Withdraw assets
  const withdraw = (asset: Address, amount: bigint, to?: Address) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "withdraw",
      args: [asset, amount, to || "0x0000000000000000000000000000000000000000"],
    });
  };

  // Borrow assets
  const borrow = (
    asset: Address,
    amount: bigint,
    interestRateMode: number,
    onBehalfOf?: Address
  ) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "borrow",
      args: [
        asset,
        amount,
        interestRateMode,
        onBehalfOf || "0x0000000000000000000000000000000000000000",
      ],
    });
  };

  // Repay borrowed assets
  const repay = (
    asset: Address,
    amount: bigint,
    rateMode: number,
    onBehalfOf?: Address
  ) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "repay",
      args: [
        asset,
        amount,
        rateMode,
        onBehalfOf || "0x0000000000000000000000000000000000000000",
      ],
    });
  };

  // Liquidate position
  const liquidationCall = (
    collateralAsset: Address,
    debtAsset: Address,
    user: Address,
    debtToCover: bigint,
    receiveAToken: boolean
  ) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "liquidationCall",
      args: [collateralAsset, debtAsset, user, debtToCover, receiveAToken],
    });
  };

  // Set user use reserve as collateral
  const setUserUseReserveAsCollateral = (
    asset: Address,
    useAsCollateral: boolean
  ) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "setUserUseReserveAsCollateral",
      args: [asset, useAsCollateral],
    });
  };

  return {
    // Read functions
    useGetUserAccountData,
    useGetReserveData,
    useGetUserReserveData,
    useGetReservesList,
    useGetLiquidationThreshold,
    useGetHealthFactor,

    // Write functions
    deposit,
    withdraw,
    borrow,
    repay,
    liquidationCall,
    setUserUseReserveAsCollateral,
    isPending,
    error,

    // Contract info
    contractAddress,
  };
}
