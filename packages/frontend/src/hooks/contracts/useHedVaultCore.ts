/**
 * HedVaultCore Contract Hooks
 * Custom hooks for interacting with the HedVaultCore smart contract
 */

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address } from "viem";
import { HedVaultCoreABI } from "../../lib/abis";
import {
  CONTRACT_ADDRESSES,
  MANTLE_TESTNET_CHAIN_ID,
} from "../../lib/contracts";

// Types
export interface ProtocolHealth {
  isHealthy: boolean;
  tvlUtilization: bigint;
  activeModules: bigint;
  lastActivity: bigint;
}

export interface ProtocolLimits {
  maxTVLLimit: bigint;
  minTxAmount: bigint;
  maxTxAmount: bigint;
  dailyTxLimit: bigint;
  dailyVolumeLimit: bigint;
}

export interface ProtocolStats {
  tvl: bigint;
  users: bigint;
  transactions: bigint;
  fees: bigint;
}

export interface UserInfo {
  isRegistered: boolean;
  registrationTime: bigint;
  lastTransaction: bigint;
  dailyTxCount: bigint;
  dailyVolume: bigint;
}

// Read Hooks - Core Module Addresses
export function useGetFeeRecipient() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "feeRecipient",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useGetMarketplace() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "marketplace",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useGetLendingPool() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "lendingPool",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useGetPriceOracle() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "priceOracle",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useGetComplianceManager() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "complianceManager",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useGetPortfolioManager() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "portfolioManager",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useGetRewardsDistributor() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "rewardsDistributor",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useGetSwapEngine() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "swapEngine",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useGetAnalyticsEngine() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "analyticsEngine",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useGetCrossChainBridge() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "crossChainBridge",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useGetRwaTokenFactory() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "rwaTokenFactory",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

// Read Hooks - Protocol State
export function useIsPaused() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "paused",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useIsInitialized() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "isInitialized",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useIsEmergencyMode() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "emergencyMode",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

export function useGetOwner() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "owner",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });
}

// Read Hooks - Protocol Constants
export function useGetProtocolConstants() {
  const { data: version } = useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "VERSION",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });

  const { data: dailyTransactionLimit } = useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "DAILY_TRANSACTION_LIMIT",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });

  const { data: dailyVolumeLimit } = useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "DAILY_VOLUME_LIMIT",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });

  const { data: rateLimitWindow } = useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "RATE_LIMIT_WINDOW",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  });

  return {
    version,
    dailyTransactionLimit,
    dailyVolumeLimit,
    rateLimitWindow,
  };
}

// Read Hooks - Fees and Limits
export function useGetProtocolFee(operation?: string) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "getProtocolFee",
    args: operation ? [operation] : undefined,
    chainId: MANTLE_TESTNET_CHAIN_ID,
    query: {
      enabled: !!operation,
    },
  });
}

export function useGetProtocolHealth() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "getProtocolHealth",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  }) as {
    data: ProtocolHealth | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

export function useGetProtocolLimits() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "getProtocolLimits",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  }) as {
    data: ProtocolLimits | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

export function useGetProtocolStats() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "getProtocolStats",
    chainId: MANTLE_TESTNET_CHAIN_ID,
  }) as {
    data: ProtocolStats | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

export function useGetUserInfo(user?: Address) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "getUserInfo",
    args: user ? [user] : undefined,
    chainId: MANTLE_TESTNET_CHAIN_ID,
    query: {
      enabled: !!user,
    },
  }) as { data: UserInfo | undefined; isLoading: boolean; error: Error | null };
}

export function useValidateTransaction(
  user?: Address,
  amount?: bigint,
  operation?: string
) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "validateTransaction",
    args: user && amount && operation ? [user, amount, operation] : undefined,
    chainId: MANTLE_TESTNET_CHAIN_ID,
    query: {
      enabled: !!user && !!amount && !!operation,
    },
  });
}

export function useIsValidModule(module?: Address) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "isValidModule",
    args: module ? [module] : undefined,
    chainId: MANTLE_TESTNET_CHAIN_ID,
    query: {
      enabled: !!module,
    },
  });
}

export function useIsCircuitBreakerActive(module?: string) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.HedVaultCore,
    abi: HedVaultCoreABI,
    functionName: "isCircuitBreakerActive",
    args: module ? [module] : undefined,
    chainId: MANTLE_TESTNET_CHAIN_ID,
    query: {
      enabled: !!module,
    },
  });
}

// Write Hooks - Admin Functions
export function useUpdateModule() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const updateModule = (moduleType: string, newModule: Address) => {
    writeContract({
      address: CONTRACT_ADDRESSES.HedVaultCore,
      abi: HedVaultCoreABI,
      functionName: "updateModule",
      args: [moduleType, newModule],
      chainId: MANTLE_TESTNET_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    updateModule,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

export function useUpdateFee() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const updateFee = (feeType: string, newFee: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.HedVaultCore,
      abi: HedVaultCoreABI,
      functionName: "updateFee",
      args: [feeType, newFee],
      chainId: MANTLE_TESTNET_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    updateFee,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

export function useBatchUpdateFees() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const batchUpdateFees = (feeTypes: string[], newFees: bigint[]) => {
    writeContract({
      address: CONTRACT_ADDRESSES.HedVaultCore,
      abi: HedVaultCoreABI,
      functionName: "batchUpdateFees",
      args: [feeTypes, newFees],
      chainId: MANTLE_TESTNET_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    batchUpdateFees,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

export function useUpdateFeeRecipient() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const updateFeeRecipient = (newFeeRecipient: Address) => {
    writeContract({
      address: CONTRACT_ADDRESSES.HedVaultCore,
      abi: HedVaultCoreABI,
      functionName: "updateFeeRecipient",
      args: [newFeeRecipient],
      chainId: MANTLE_TESTNET_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    updateFeeRecipient,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

export function useUpdateProtocolLimit() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const updateProtocolLimit = (limitType: string, newLimit: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.HedVaultCore,
      abi: HedVaultCoreABI,
      functionName: "updateProtocolLimit",
      args: [limitType, newLimit],
      chainId: MANTLE_TESTNET_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    updateProtocolLimit,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

// Write Hooks - Protocol Control
export function usePauseContract() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const pauseContract = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.HedVaultCore,
      abi: HedVaultCoreABI,
      functionName: "pause",
      chainId: MANTLE_TESTNET_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    pauseContract,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

export function useUnpauseContract() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const unpauseContract = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.HedVaultCore,
      abi: HedVaultCoreABI,
      functionName: "unpause",
      chainId: MANTLE_TESTNET_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    unpauseContract,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

export function useActivateEmergencyMode() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const activateEmergencyMode = (reason: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.HedVaultCore,
      abi: HedVaultCoreABI,
      functionName: "activateEmergencyMode",
      args: [reason],
      chainId: MANTLE_TESTNET_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    activateEmergencyMode,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

export function useDeactivateEmergencyMode() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const deactivateEmergencyMode = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.HedVaultCore,
      abi: HedVaultCoreABI,
      functionName: "deactivateEmergencyMode",
      chainId: MANTLE_TESTNET_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    deactivateEmergencyMode,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

export function useRegisterUser() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const registerUser = (user: Address) => {
    writeContract({
      address: CONTRACT_ADDRESSES.HedVaultCore,
      abi: HedVaultCoreABI,
      functionName: "registerUser",
      args: [user],
      chainId: MANTLE_TESTNET_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    registerUser,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

export function useAddAdmin() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const addAdmin = (admin: Address) => {
    writeContract({
      address: CONTRACT_ADDRESSES.HedVaultCore,
      abi: HedVaultCoreABI,
      functionName: "addAdmin",
      args: [admin],
      chainId: MANTLE_TESTNET_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    addAdmin,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

export function useRemoveAdmin() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const removeAdmin = (admin: Address) => {
    writeContract({
      address: CONTRACT_ADDRESSES.HedVaultCore,
      abi: HedVaultCoreABI,
      functionName: "removeAdmin",
      args: [admin],
      chainId: MANTLE_TESTNET_CHAIN_ID,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  return {
    removeAdmin,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}
