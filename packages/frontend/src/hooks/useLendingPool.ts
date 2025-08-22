import { useReadContract, useWriteContract, useEstimateGas } from "wagmi";
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
      functionName: "getUserHealthFactor",
      args: [user],
    });
  };

  // New read functions from updated contract
  const useGetAvailableLiquidity = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getAvailableLiquidity",
      args: [asset],
    });
  };

  const useGetAvailableToBorrow = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getAvailableToBorrow",
      args: [asset],
    });
  };

  const useGetTotalDeposited = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getTotalDeposited",
      args: [asset],
    });
  };

  const useGetTotalBorrowedAmount = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getTotalBorrowedAmount",
      args: [asset],
    });
  };

  const useGetPoolStats = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getPoolStats",
      args: [asset],
    });
  };

  const useGetMaxBorrowableAmount = (user: Address, asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getMaxBorrowableAmount",
      args: [user, asset],
    });
  };

  const useGetBorrowingPosition = (user: Address, asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getBorrowingPosition",
      args: [user, asset],
    });
  };

  const useGetLendingPosition = (user: Address, asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getLendingPosition",
      args: [user, asset],
    });
  };

  const useGetInterestRate = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getInterestRate",
      args: [asset],
    });
  };

  const useCalculateInterest = (
    asset: Address,
    amount: bigint,
    duration: bigint
  ) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "calculateInterest",
      args: [asset, amount, duration],
    });
  };

  const useGetCollateralRatio = (borrower: Address, asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "getCollateralRatio",
      args: [borrower, asset],
    });
  };

  const useSupportedAssets = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "supportedAssets",
      args: [asset],
    });
  };

  const useCollateralFactors = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "collateralFactors",
      args: [asset],
    });
  };

  const useLiquidationThresholds = (asset: Address) => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "liquidationThresholds",
      args: [asset],
    });
  };

  const useMinBorrowAmount = () => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "minBorrowAmount",
    });
  };

  const useMinDepositAmount = () => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "minDepositAmount",
    });
  };

  const usePaused = () => {
    return useReadContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "paused",
    });
  };

  // Write contract hook
  const { writeContract, isPending, error } = useWriteContract();

  // Deposit assets
  const deposit = (asset: Address, amount: bigint) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "deposit",
      args: [asset, amount],
      gas: BigInt(85000000), // Set very high gas limit for complex DeFi transactions
    });
  };

  // Withdraw assets
  const withdraw = (asset: Address, amount: bigint) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "withdraw",
      args: [asset, amount],
      gas: BigInt(85000000), // Set higher gas limit for withdraw transactions
    });
  };

  // Borrow assets (simple version)
  const borrow = (asset: Address, amount: bigint) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "borrow",
      args: [asset, amount],
      gas: BigInt(85000000), // Set higher gas limit for borrow transactions
    });
  };

  // Borrow assets with collateral
  const borrowWithCollateral = (
    asset: Address,
    amount: bigint,
    collateral: Address,
    collateralAmount: bigint
  ) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "borrow",
      args: [asset, amount, collateral, collateralAmount],
      gas: BigInt(85000000), // Set higher gas limit for complex borrow transactions
    });
  };

  // Repay borrowed assets
  const repay = (asset: Address, amount: bigint) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "repay",
      args: [asset, amount],
      gas: BigInt(85000000), // Set higher gas limit for repay transactions
    });
  };

  // Liquidate position (simple version)
  const liquidate = (borrower: Address, asset: Address) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "liquidate",
      args: [borrower, asset],
    });
  };

  // Liquidate position with specific amounts
  const liquidateWithAmount = (
    borrower: Address,
    borrowAsset: Address,
    collateralAsset: Address,
    repayAmount: bigint
  ) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "liquidate",
      args: [borrower, borrowAsset, collateralAsset, repayAmount],
    });
  };

  // Emergency withdraw
  const emergencyWithdraw = (asset: Address) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "emergencyWithdraw",
      args: [asset],
    });
  };

  // Admin functions
  const addAsset = (
    asset: Address,
    collateralFactor: bigint,
    baseRate: bigint
  ) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "addAsset",
      args: [asset, collateralFactor, baseRate],
    });
  };

  const removeAsset = (asset: Address) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "removeAsset",
      args: [asset],
    });
  };

  const setCollateralFactor = (asset: Address, newFactor: bigint) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "setCollateralFactor",
      args: [asset, newFactor],
    });
  };

  const setInterestRate = (asset: Address, rate: bigint) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "setInterestRate",
      args: [asset, rate],
    });
  };

  const setLiquidationThreshold = (asset: Address, newThreshold: bigint) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "setLiquidationThreshold",
      args: [asset, newThreshold],
    });
  };

  const setMinAmounts = (newMinBorrow: bigint, newMinDeposit: bigint) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "setMinAmounts",
      args: [newMinBorrow, newMinDeposit],
    });
  };

  const setReserveFactor = (newFactor: bigint) => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "setReserveFactor",
      args: [newFactor],
    });
  };

  const pause = () => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "pause",
      args: [],
    });
  };

  const unpause = () => {
    writeContract({
      address: contractAddress,
      abi: LendingPoolABI,
      functionName: "unpause",
      args: [],
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
    useGetAvailableLiquidity,
    useGetAvailableToBorrow,
    useGetTotalDeposited,
    useGetTotalBorrowedAmount,
    useGetPoolStats,
    useGetMaxBorrowableAmount,
    useGetBorrowingPosition,
    useGetLendingPosition,
    useGetInterestRate,
    useCalculateInterest,
    useGetCollateralRatio,
    useSupportedAssets,
    useCollateralFactors,
    useLiquidationThresholds,
    useMinBorrowAmount,
    useMinDepositAmount,
    usePaused,

    // Write functions
    deposit,
    withdraw,
    borrow,
    borrowWithCollateral,
    repay,
    liquidate,
    liquidateWithAmount,
    emergencyWithdraw,
    addAsset,
    removeAsset,
    setCollateralFactor,
    setInterestRate,
    setLiquidationThreshold,
    setMinAmounts,
    setReserveFactor,
    pause,
    unpause,
    isPending,
    error,

    // Contract info
    contractAddress,
  };
}
