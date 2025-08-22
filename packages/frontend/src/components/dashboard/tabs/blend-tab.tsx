"use client";

import { useState, useEffect, useRef } from "react";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Removed Select imports - using native select elements
import { toast } from "sonner";
import { Address, parseEther } from "viem";
import { useLendingPool } from "@/hooks/useLendingPool";
import { useERC20 } from "@/hooks/useERC20";
import { CONTRACTS } from "@/config/contracts";
import { useAccount } from "wagmi";

// Helper function to replace formatEther
const formatEther = (value: bigint): string => {
  return (Number(value) / 1e18).toString();
};

// RWA Token addresses from deployment
const RWA_TOKEN_ADDRESSES = {
  GOLD_RESERVE: "0xd3871a7653073f2c8e4ed9d8d798303586a44f55" as Address,
  PREMIUM_REAL_ESTATE: "0xad95399b7dddf51145e7fd5735c865e474c5c010" as Address,
  DIGITAL_ART: "0x91755aee9e26355aea0b102e48a46d0918490d4f" as Address,
  RENEWABLE_ENERGY: "0xf7be754c0efea6e0cdd5a511770996af4769e6d6" as Address,
};

export function BlendTab() {
  const [activeStrategy, setActiveStrategy] = useState("lend");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<Address>(
    RWA_TOKEN_ADDRESSES.GOLD_RESERVE
  );
  const [selectedCollateralToken, setSelectedCollateralToken] =
    useState<Address>(RWA_TOKEN_ADDRESSES.PREMIUM_REAL_ESTATE);
  const [selectedBorrowToken, setSelectedBorrowToken] = useState<Address>(
    RWA_TOKEN_ADDRESSES.GOLD_RESERVE
  );
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [isApprovalInProgress, setIsApprovalInProgress] = useState(false);
  const [isCollateralApprovalInProgress, setIsCollateralApprovalInProgress] =
    useState(false);
  const [totalLentAmount, setTotalLentAmount] = useState(0);
  const [goldLentAmount, setGoldLentAmount] = useState(0);
  const [realEstateLentAmount, setRealEstateLentAmount] = useState(0);
  const [invoiceLentAmount, setInvoiceLentAmount] = useState(0);
  const pendingDepositTokenRef = useRef<Address>(
    RWA_TOKEN_ADDRESSES.GOLD_RESERVE
  );
  const pendingDepositAmountRef = useRef<string>("");
  const pendingWithdrawAmountRef = useRef<string>("");
  const pendingWithdrawTokenRef = useRef<Address>(
    RWA_TOKEN_ADDRESSES.GOLD_RESERVE
  );

  // Initialize LendingPool hooks
  const lendingPool = useLendingPool();

  // Helper function to get token type from address
  const getTokenType = (tokenAddress: Address): string => {
    switch (tokenAddress) {
      case RWA_TOKEN_ADDRESSES.GOLD_RESERVE:
        return "GOLD_RESERVE";
      case RWA_TOKEN_ADDRESSES.PREMIUM_REAL_ESTATE:
        return "PREMIUM_REAL_ESTATE";
      case RWA_TOKEN_ADDRESSES.DIGITAL_ART:
        return "DIGITAL_ART";
      case RWA_TOKEN_ADDRESSES.RENEWABLE_ENERGY:
        return "RENEWABLE_ENERGY";
      default:
        return "UNKNOWN";
    }
  };

  // LendingPool contract interactions
  const handleDepositAction = () => {
    try {
      const amount = parseEther(depositAmount);
      lendingPool.deposit(selectedToken, amount);
      toast.success("Deposit transaction submitted!");
      setDepositAmount("");
    } catch (error) {
      toast.error("Invalid deposit amount");
    }
  };

  const handleWithdrawAction = () => {
    try {
      const amount = parseEther(withdrawAmount);
      lendingPool.withdraw(selectedToken, amount);
      toast.success("Withdrawal transaction submitted!");
      setWithdrawAmount("");
    } catch (error) {
      toast.error("Invalid withdrawal amount");
    }
  };

  const handleBorrowAction = () => {
    try {
      const borrowAmountBigInt = parseEther(borrowAmount);
      const collateralAmountBigInt = parseEther(collateralAmount);
      lendingPool.borrowWithCollateral(
        selectedBorrowToken,
        borrowAmountBigInt,
        selectedCollateralToken,
        collateralAmountBigInt
      );
      toast.success("Borrow transaction submitted!");
      setBorrowAmount("");
      setCollateralAmount("");
    } catch (error) {
      toast.error("Invalid borrow parameters");
    }
  };

  const handleRepayAction = () => {
    try {
      const amount = parseEther(repayAmount);
      lendingPool.repay(selectedBorrowToken, amount);
      toast.success("Repay transaction submitted!");
      setRepayAmount("");
    } catch (error) {
      toast.error("Invalid repay amount");
    }
  };

  // For backward compatibility with existing UI
  const deposit = {
    deposit: handleDepositAction,
    isPending: lendingPool.isPending,
    isConfirmed: false,
    error: lendingPool.error,
  };

  const withdraw = {
    withdraw: handleWithdrawAction,
    isPending: lendingPool.isPending,
    isConfirmed: false,
    error: lendingPool.error,
  };

  const createLoan = {
    createLoan: handleBorrowAction,
    isPending: lendingPool.isPending,
    isConfirmed: false,
    error: lendingPool.error,
  };

  const repayLoan = {
    repayLoan: handleRepayAction,
    isPending: lendingPool.isPending,
    isConfirmed: false,
    error: lendingPool.error,
  };

  // Get user account
  const { address: userAddress } = useAccount();

  // Real total deposit data from LendingPool contract (across all users)
  const goldReserveDeposits = lendingPool.useGetTotalDeposited(
    RWA_TOKEN_ADDRESSES.GOLD_RESERVE
  );
  const premiumRealEstateDeposits = lendingPool.useGetTotalDeposited(
    RWA_TOKEN_ADDRESSES.PREMIUM_REAL_ESTATE
  );
  const digitalArtDeposits = lendingPool.useGetTotalDeposited(
    RWA_TOKEN_ADDRESSES.DIGITAL_ART
  );
  const renewableEnergyDeposits = lendingPool.useGetTotalDeposited(
    RWA_TOKEN_ADDRESSES.RENEWABLE_ENERGY
  );

  // User-specific deposit data for individual positions
  const userGoldReserveDeposits = lendingPool.useGetLendingPosition(
    userAddress || "0x0",
    RWA_TOKEN_ADDRESSES.GOLD_RESERVE
  );
  const userPremiumRealEstateDeposits = lendingPool.useGetLendingPosition(
    userAddress || "0x0",
    RWA_TOKEN_ADDRESSES.PREMIUM_REAL_ESTATE
  );
  const userDigitalArtDeposits = lendingPool.useGetLendingPosition(
    userAddress || "0x0",
    RWA_TOKEN_ADDRESSES.DIGITAL_ART
  );
  const userRenewableEnergyDeposits = lendingPool.useGetLendingPosition(
    userAddress || "0x0",
    RWA_TOKEN_ADDRESSES.RENEWABLE_ENERGY
  );

  // Total borrowed amounts for each asset
  const goldReserveBorrowed = lendingPool.useGetTotalBorrowedAmount(
    RWA_TOKEN_ADDRESSES.GOLD_RESERVE
  );
  const premiumRealEstateBorrowed = lendingPool.useGetTotalBorrowedAmount(
    RWA_TOKEN_ADDRESSES.PREMIUM_REAL_ESTATE
  );
  const digitalArtBorrowed = lendingPool.useGetTotalBorrowedAmount(
    RWA_TOKEN_ADDRESSES.DIGITAL_ART
  );
  const renewableEnergyBorrowed = lendingPool.useGetTotalBorrowedAmount(
    RWA_TOKEN_ADDRESSES.RENEWABLE_ENERGY
  );

  // Available to borrow amounts for each asset
  const goldReserveAvailable = lendingPool.useGetAvailableToBorrow(
    RWA_TOKEN_ADDRESSES.GOLD_RESERVE
  );
  const premiumRealEstateAvailable = lendingPool.useGetAvailableToBorrow(
    RWA_TOKEN_ADDRESSES.PREMIUM_REAL_ESTATE
  );
  const digitalArtAvailable = lendingPool.useGetAvailableToBorrow(
    RWA_TOKEN_ADDRESSES.DIGITAL_ART
  );
  const renewableEnergyAvailable = lendingPool.useGetAvailableToBorrow(
    RWA_TOKEN_ADDRESSES.RENEWABLE_ENERGY
  );

  // Pool statistics for each asset (includes utilization rates)
  const goldReserveStats = lendingPool.useGetPoolStats(
    RWA_TOKEN_ADDRESSES.GOLD_RESERVE
  );
  const premiumRealEstateStats = lendingPool.useGetPoolStats(
    RWA_TOKEN_ADDRESSES.PREMIUM_REAL_ESTATE
  );
  const digitalArtStats = lendingPool.useGetPoolStats(
    RWA_TOKEN_ADDRESSES.DIGITAL_ART
  );
  const renewableEnergyStats = lendingPool.useGetPoolStats(
    RWA_TOKEN_ADDRESSES.RENEWABLE_ENERGY
  );

  // Real token data using ERC20 hooks
  const selectedTokenERC20 = useERC20(selectedToken);
  const tokenBalance = selectedTokenERC20.useBalance(userAddress || "0x0");
  const tokenAllowance = selectedTokenERC20.useAllowance(
    userAddress || "0x0",
    CONTRACTS.LendingPool
  );
  const tokenApproval = {
    approve: (spender: Address, amount: bigint) => {
      selectedTokenERC20.approve(spender, amount);
      toast.success("Token approval submitted!");
      // Don't set isApprovalInProgress to false here - let useEffect handle it
    },
    isPending: selectedTokenERC20.isPending,
    isLoading: selectedTokenERC20.isPending,
  };

  // Real collateral data using ERC20 hooks
  const selectedCollateralERC20 = useERC20(selectedCollateralToken);
  const collateralBalance = selectedCollateralERC20.useBalance(
    userAddress || "0x0"
  );
  const collateralAllowance = selectedCollateralERC20.useAllowance(
    userAddress || "0x0",
    CONTRACTS.LendingPool
  );
  const collateralApproval = {
    approve: (spender: Address, amount: bigint) => {
      selectedCollateralERC20.approve(spender, amount);
      toast.success("Collateral approval submitted!");
      // Don't set isCollateralApprovalInProgress to false here - let useEffect handle it
    },
    isPending: selectedCollateralERC20.isPending,
    isLoading: selectedCollateralERC20.isPending,
  };

  // Calculate total deposits across all tokens
  const calculateTotalDeposits = () => {
    // Convert BigInt to number (data is in wei, so divide by 10^18)
    const goldReserve = goldReserveDeposits.data
      ? Number(goldReserveDeposits.data) / 1e18
      : 0;
    const premiumRealEstate = premiumRealEstateDeposits.data
      ? Number(premiumRealEstateDeposits.data) / 1e18
      : 0;
    const digitalArt = digitalArtDeposits.data
      ? Number(digitalArtDeposits.data) / 1e18
      : 0;
    const renewableEnergy = renewableEnergyDeposits.data
      ? Number(renewableEnergyDeposits.data) / 1e18
      : 0;

    return goldReserve + premiumRealEstate + digitalArt + renewableEnergy;
  };

  // Calculate total deposits and loading state
  const totalDeposits = calculateTotalDeposits();
  const isLoadingDeposits =
    goldReserveDeposits.isLoading ||
    premiumRealEstateDeposits.isLoading ||
    digitalArtDeposits.isLoading ||
    renewableEnergyDeposits.isLoading;

  // Handle deposit success/error - removed as we handle this in the action functions

  // Transaction success/error handling is now done in the action functions

  // Handle token approval success and auto-trigger deposit
  useEffect(() => {
    if (
      !selectedTokenERC20.isPending &&
      isApprovalInProgress &&
      pendingDepositAmountRef.current
    ) {
      // Check if approval was successful by checking allowance
      const checkAllowanceAndDeposit = async () => {
        try {
          const amount = parseEther(pendingDepositAmountRef.current);
          const currentAllowance = tokenAllowance.data || BigInt(0);

          if (currentAllowance >= amount) {
            toast.success("Token approval successful! Executing deposit...");
            setIsApprovalInProgress(false);

            // Auto-trigger deposit after successful approval
            lendingPool.deposit(pendingDepositTokenRef.current, amount);
            toast.info("Deposit transaction submitted...");

            // Clear pending refs
            pendingDepositAmountRef.current = "";
            setDepositAmount("");
          }
        } catch (error) {
          console.error(
            "Error checking allowance or executing deposit:",
            error
          );
          setIsApprovalInProgress(false);
        }
      };

      // Small delay to ensure allowance is updated
      setTimeout(checkAllowanceAndDeposit, 1000);
    }
  }, [
    selectedTokenERC20.isPending,
    isApprovalInProgress,
    tokenAllowance.data,
    lendingPool,
    pendingDepositAmountRef,
    pendingDepositTokenRef,
  ]);

  // Handle collateral approval success and auto-trigger loan creation
  useEffect(() => {
    if (
      !selectedCollateralERC20.isPending &&
      isCollateralApprovalInProgress &&
      collateralAmount &&
      borrowAmount
    ) {
      // Check if approval was successful by checking allowance
      const checkAllowanceAndCreateLoan = async () => {
        try {
          const collateralAmountBigInt = parseEther(collateralAmount);
          const borrowAmountBigInt = parseEther(borrowAmount);
          const currentAllowance = collateralAllowance.data || BigInt(0);

          if (currentAllowance >= collateralAmountBigInt) {
            toast.success("Collateral approval successful! Creating loan...");
            setIsCollateralApprovalInProgress(false);

            // Auto-trigger loan creation after successful approval
            lendingPool.borrowWithCollateral(
              selectedBorrowToken,
              borrowAmountBigInt,
              selectedCollateralToken,
              collateralAmountBigInt
            );
            toast.info("Loan creation transaction submitted...");

            // Clear form
            setBorrowAmount("");
            setCollateralAmount("");
          }
        } catch (error) {
          console.error("Error checking allowance or creating loan:", error);
          setIsCollateralApprovalInProgress(false);
        }
      };

      // Small delay to ensure allowance is updated
      setTimeout(checkAllowanceAndCreateLoan, 1000);
    }
  }, [
    selectedCollateralERC20.isPending,
    isCollateralApprovalInProgress,
    collateralAllowance.data,
    lendingPool,
    collateralAmount,
    borrowAmount,
    selectedBorrowToken,
    selectedCollateralToken,
  ]);

  // Handler functions
  const handleDeposit = () => {
    if (!depositAmount) {
      toast.error("Please enter deposit amount");
      return;
    }
    if (isApprovalInProgress || tokenApproval.isPending) {
      return; // Prevent multiple approvals
    }
    try {
      const amount = parseEther(depositAmount);

      // Check if user has sufficient balance
      if (tokenBalance.data && tokenBalance.data < amount) {
        toast.error("Insufficient token balance");
        return;
      }

      // Store the deposit amount and token in ref for later use in success handler
      pendingDepositAmountRef.current = depositAmount;
      pendingDepositTokenRef.current = selectedToken;

      // Always trigger approval first to ensure two-step process
      // This will show approval popup first, then auto-trigger deposit
      setIsApprovalInProgress(true);
      tokenApproval.approve(CONTRACTS.LendingPool, amount);
    } catch (error) {
      toast.error("Invalid amount");
      setIsApprovalInProgress(false);
    }
  };

  const handleWithdraw = () => {
    if (!withdrawAmount) {
      toast.error("Please enter withdrawal amount");
      return;
    }
    try {
      const amount = parseEther(withdrawAmount);

      // Store the withdraw amount and token in ref for later use in success handler
      pendingWithdrawAmountRef.current = withdrawAmount;
      pendingWithdrawTokenRef.current = selectedToken;

      lendingPool.withdraw(selectedToken, amount);
      toast.info("Withdrawal transaction submitted...");
    } catch (error) {
      toast.error("Invalid amount");
    }
  };

  const handleCreateLoan = () => {
    if (!collateralAmount || !borrowAmount) {
      toast.error("Please enter collateral and borrow amounts");
      return;
    }
    if (selectedCollateralToken === selectedBorrowToken) {
      toast.error("Collateral and borrow tokens must be different");
      return;
    }
    if (isCollateralApprovalInProgress || collateralApproval.isPending) {
      return; // Prevent multiple approvals
    }
    try {
      const collateralAmountBigInt = parseEther(collateralAmount);
      const borrowAmountBigInt = parseEther(borrowAmount);

      // Always trigger approval first to ensure two-step process
      // This will show approval popup first, then auto-trigger loan creation
      setIsCollateralApprovalInProgress(true);
      collateralApproval.approve(CONTRACTS.LendingPool, collateralAmountBigInt);
    } catch (error) {
      toast.error("Invalid amounts");
      setIsCollateralApprovalInProgress(false);
    }
  };

  const handleRepayLoan = () => {
    if (!repayAmount || !selectedLoanId) {
      toast.error("Please enter repay amount and loan ID");
      return;
    }
    try {
      const amount = parseEther(repayAmount);
      const loanId = BigInt(selectedLoanId);
      lendingPool.repay(selectedToken, amount); // Note: Using selectedToken as asset for repayment
      toast.info("Loan repayment transaction submitted...");
    } catch (error) {
      toast.error("Invalid amount or loan ID");
    }
  };

  const lendingOpportunities = [
    {
      asset: "Gold Reserve Token",
      symbol: "GRT",
      apy: "6.2%",
      totalLent: `$${(goldReserveDeposits.data
        ? Number(goldReserveDeposits.data) / 1e18
        : 0
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      available: "$1.8M",
      risk: "Low",
    },
    {
      asset: "Premium Real Estate Token",
      symbol: "PRET",
      apy: "8.5%",
      totalLent: `$${(premiumRealEstateDeposits.data
        ? Number(premiumRealEstateDeposits.data) / 1e18
        : 0
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      available: "$2.5M",
      risk: "Low",
    },
    {
      asset: "Digital Art Token",
      symbol: "DAT",
      apy: "12.3%",
      totalLent: `$${(digitalArtDeposits.data
        ? Number(digitalArtDeposits.data) / 1e18
        : 0
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      available: "$850K",
      risk: "Medium",
    },
    {
      asset: "Renewable Energy Credits",
      symbol: "REC",
      apy: "9.8%",
      totalLent: `$${(renewableEnergyDeposits.data
        ? Number(renewableEnergyDeposits.data) / 1e18
        : 0
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      available: "$1.2M",
      risk: "Medium",
    },
  ];

  const borrowingOptions = [
    {
      asset: "Gold Reserve Token",
      symbol: "GRT",
      collateral: "Premium Real Estate Token",
      ltv: "75%",
      interestRate: "6.2%",
      borrowed: `$${(goldReserveBorrowed.data
        ? Number(goldReserveBorrowed.data) / 1e18
        : 0
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      available: `$${(goldReserveAvailable.data
        ? Number(goldReserveAvailable.data) / 1e18
        : 0
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      utilizationRate: goldReserveStats.data && Array.isArray(goldReserveStats.data) && goldReserveStats.data.length > 3
        ? `${(Number(goldReserveStats.data[3]) / 100).toFixed(1)}%`
        : "0.0%",
    },
    {
      asset: "Premium Real Estate Token",
      symbol: "PRET",
      collateral: "Gold Reserve Token",
      ltv: "70%",
      interestRate: "8.5%",
      borrowed: `$${(premiumRealEstateBorrowed.data
        ? Number(premiumRealEstateBorrowed.data) / 1e18
        : 0
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      available: `$${(premiumRealEstateAvailable.data
        ? Number(premiumRealEstateAvailable.data) / 1e18
        : 0
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      utilizationRate: premiumRealEstateStats.data && Array.isArray(premiumRealEstateStats.data) && premiumRealEstateStats.data.length > 3
        ? `${(Number(premiumRealEstateStats.data[3]) / 100).toFixed(1)}%`
        : "0.0%",
    },
    {
      asset: "Digital Art Token",
      symbol: "DAT",
      collateral: "Renewable Energy Credits",
      ltv: "65%",
      interestRate: "12.3%",
      borrowed: `$${(digitalArtBorrowed.data
        ? Number(digitalArtBorrowed.data) / 1e18
        : 0
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      available: `$${(digitalArtAvailable.data
        ? Number(digitalArtAvailable.data) / 1e18
        : 0
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      utilizationRate: digitalArtStats.data && Array.isArray(digitalArtStats.data) && digitalArtStats.data.length > 3
        ? `${(Number(digitalArtStats.data[3]) / 100).toFixed(1)}%`
        : "0.0%",
    },
    {
      asset: "Renewable Energy Credits",
      symbol: "REC",
      collateral: "Digital Art Token",
      ltv: "68%",
      interestRate: "9.8%",
      borrowed: `$${(renewableEnergyBorrowed.data
        ? Number(renewableEnergyBorrowed.data) / 1e18
        : 0
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      available: `$${(renewableEnergyAvailable.data
        ? Number(renewableEnergyAvailable.data) / 1e18
        : 0
      ).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      utilizationRate: renewableEnergyStats.data && Array.isArray(renewableEnergyStats.data) && renewableEnergyStats.data.length > 3
        ? `${(Number(renewableEnergyStats.data[3]) / 100).toFixed(1)}%`
        : "0.0%",
    },
  ];

  const yieldStrategies = [
    {
      name: "Conservative RWA Portfolio",
      description: "Low-risk lending across diversified real-world assets",
      apy: "7.8%",
      tvl: "$2.1M",
      assets: ["RET", "GOLD", "BONDS"],
      risk: "Low",
    },
    {
      name: "High-Yield Invoice Strategy",
      description: "Higher returns through invoice factoring and trade finance",
      apy: "14.2%",
      tvl: "$850K",
      assets: ["INV", "TRADE", "SUPPLY"],
      risk: "Medium",
    },
    {
      name: "Balanced Growth Strategy",
      description: "Mixed lending and borrowing for optimized returns",
      apy: "11.5%",
      tvl: "$1.5M",
      assets: ["RET", "GOLD", "INV", "USDC"],
      risk: "Medium",
    },
  ];

  const renderLendingContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gray-900/70 text-center">
          <p className="text-gray-400 text-sm">Total Lent</p>
          <p className="text-2xl font-bold text-green-400">
            {isLoadingDeposits
              ? "Loading..."
              : `$${totalDeposits.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-900/70 text-center">
          <p className="text-gray-400 text-sm">Average APY</p>
          <p className="text-2xl font-bold text-white">9.0%</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-900/70 text-center">
          <p className="text-gray-400 text-sm">Monthly Earnings</p>
          <p className="text-2xl font-bold text-green-400">$0</p>
          <p className="text-gray-400 text-xs mt-1">Coming Soon</p>
        </div>
      </div>

      <div className="space-y-4">
        {lendingOpportunities.map((opportunity, index) => (
          <div
            key={index}
            className="p-6 rounded-lg bg-gray-900/60 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <span className="text-green-400 font-semibold text-sm">
                    {opportunity.symbol}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {opportunity.asset}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Available: {opportunity.available}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">
                  {opportunity.apy}
                </p>
                <p className="text-gray-400 text-sm">APY</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-xs">Your Lending</p>
                <p className="text-white font-medium">
                  {opportunity.totalLent}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Risk Level</p>
                <p
                  className={`font-medium ${
                    opportunity.risk === "Low"
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {opportunity.risk}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="deposit-amount"
                    className="text-gray-400 text-sm"
                  >
                    Deposit Amount
                  </Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="0.0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="withdraw-amount"
                    className="text-gray-400 text-sm"
                  >
                    Withdraw Amount
                  </Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="0.0"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="token-select" className="text-gray-400 text-sm">
                  Select Token
                </Label>
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value as Address)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value={RWA_TOKEN_ADDRESSES.GOLD_RESERVE}>
                    Gold Reserve Token (GRT)
                  </option>
                  <option value={RWA_TOKEN_ADDRESSES.PREMIUM_REAL_ESTATE}>
                    Premium Real Estate Token (PRET)
                  </option>
                  <option value={RWA_TOKEN_ADDRESSES.DIGITAL_ART}>
                    Digital Art Token (DAT)
                  </option>
                  <option value={RWA_TOKEN_ADDRESSES.RENEWABLE_ENERGY}>
                    Renewable Energy Credits (REC)
                  </option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600 text-black"
                  onClick={handleDeposit}
                  disabled={deposit.isPending || tokenApproval.isPending}
                >
                  {tokenApproval.isPending
                    ? "Approving..."
                    : deposit.isPending
                    ? "Depositing..."
                    : "Deposit"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-600 text-white bg-transparent"
                  onClick={handleWithdraw}
                  disabled={withdraw.isPending}
                >
                  {withdraw.isPending ? "Withdrawing..." : "Withdraw"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Calculate total borrowed and available amounts
  const calculateTotalBorrowed = () => {
    const goldReserve = goldReserveBorrowed.data ? Number(goldReserveBorrowed.data) / 1e18 : 0;
    const premiumRealEstate = premiumRealEstateBorrowed.data ? Number(premiumRealEstateBorrowed.data) / 1e18 : 0;
    const digitalArt = digitalArtBorrowed.data ? Number(digitalArtBorrowed.data) / 1e18 : 0;
    const renewableEnergy = renewableEnergyBorrowed.data ? Number(renewableEnergyBorrowed.data) / 1e18 : 0;
    return goldReserve + premiumRealEstate + digitalArt + renewableEnergy;
  };

  const calculateTotalAvailable = () => {
    const goldReserve = goldReserveAvailable.data ? Number(goldReserveAvailable.data) / 1e18 : 0;
    const premiumRealEstate = premiumRealEstateAvailable.data ? Number(premiumRealEstateAvailable.data) / 1e18 : 0;
    const digitalArt = digitalArtAvailable.data ? Number(digitalArtAvailable.data) / 1e18 : 0;
    const renewableEnergy = renewableEnergyAvailable.data ? Number(renewableEnergyAvailable.data) / 1e18 : 0;
    return goldReserve + premiumRealEstate + digitalArt + renewableEnergy;
  };

  const totalBorrowed = calculateTotalBorrowed();
  const totalAvailable = calculateTotalAvailable();
  const isLoadingBorrowing = goldReserveBorrowed.isLoading || premiumRealEstateBorrowed.isLoading || digitalArtBorrowed.isLoading || renewableEnergyBorrowed.isLoading;

  const renderBorrowingContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gray-900/70 text-center">
          <p className="text-gray-400 text-sm">Total Borrowed</p>
          <p className="text-2xl font-bold text-blue-400">
            {isLoadingBorrowing
              ? "Loading..."
              : `$${totalBorrowed.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-900/70 text-center">
          <p className="text-gray-400 text-sm">Available to Borrow</p>
          <p className="text-2xl font-bold text-white">
            {isLoadingBorrowing
              ? "Loading..."
              : `$${totalAvailable.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-900/70 text-center">
          <p className="text-gray-400 text-sm">Health Factor</p>
          <p className="text-2xl font-bold text-green-400">2.1</p>
          <p className="text-gray-400 text-xs mt-1">Coming Soon</p>
        </div>
      </div>

      <div className="space-y-4">
        {borrowingOptions.map((option, index) => (
          <div
            key={index}
            className="p-6 rounded-lg bg-gray-900/60 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold">
                  Borrow {option.asset}
                </h3>
                <p className="text-gray-400 text-sm">
                  Collateral: {option.collateral}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-400">
                  {option.interestRate}
                </p>
                <p className="text-gray-400 text-sm">Interest Rate</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-xs">Currently Borrowed</p>
                <p className="text-white font-medium">{option.borrowed}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Available</p>
                <p className="text-white font-medium">{option.available}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Max LTV</p>
                <p className="text-white font-medium">{option.ltv}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Utilization Rate</p>
                <p className="text-white font-medium">{option.utilizationRate}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="collateral-amount"
                    className="text-gray-400 text-sm"
                  >
                    Collateral Amount
                  </Label>
                  <Input
                    id="collateral-amount"
                    type="number"
                    placeholder="0.0"
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="borrow-amount"
                    className="text-gray-400 text-sm"
                  >
                    Borrow Amount
                  </Label>
                  <Input
                    id="borrow-amount"
                    type="number"
                    placeholder="0.0"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="collateral-token"
                    className="text-gray-400 text-sm"
                  >
                    Collateral Token
                  </Label>
                  <select
                    value={selectedCollateralToken}
                    onChange={(e) =>
                      setSelectedCollateralToken(e.target.value as Address)
                    }
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value={RWA_TOKEN_ADDRESSES.GOLD_RESERVE}>
                      Gold Reserve Token (GRT)
                    </option>
                    <option value={RWA_TOKEN_ADDRESSES.PREMIUM_REAL_ESTATE}>
                      Premium Real Estate Token (PRET)
                    </option>
                    <option value={RWA_TOKEN_ADDRESSES.DIGITAL_ART}>
                      Digital Art Token (DAT)
                    </option>
                    <option value={RWA_TOKEN_ADDRESSES.RENEWABLE_ENERGY}>
                      Renewable Energy Credits (REC)
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="borrow-token"
                    className="text-gray-400 text-sm"
                  >
                    Borrow Token
                  </Label>
                  <select
                    value={selectedBorrowToken}
                    onChange={(e) =>
                      setSelectedBorrowToken(e.target.value as Address)
                    }
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value={RWA_TOKEN_ADDRESSES.GOLD_RESERVE}>
                      Gold Reserve Token (GRT)
                    </option>
                    <option value={RWA_TOKEN_ADDRESSES.PREMIUM_REAL_ESTATE}>
                      Premium Real Estate Token (PRET)
                    </option>
                    <option value={RWA_TOKEN_ADDRESSES.DIGITAL_ART}>
                      Digital Art Token (DAT)
                    </option>
                    <option value={RWA_TOKEN_ADDRESSES.RENEWABLE_ENERGY}>
                      Renewable Energy Credits (REC)
                    </option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loan-id" className="text-gray-400 text-sm">
                    Loan ID (for repayment)
                  </Label>
                  <Input
                    id="loan-id"
                    type="number"
                    placeholder="0"
                    value={selectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="repay-amount"
                    className="text-gray-400 text-sm"
                  >
                    Repay Amount
                  </Label>
                  <Input
                    id="repay-amount"
                    type="number"
                    placeholder="0.0"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleCreateLoan}
                  disabled={
                    createLoan.isPending || collateralApproval.isPending
                  }
                >
                  {collateralApproval.isPending
                    ? "Approving..."
                    : createLoan.isPending
                    ? "Creating Loan..."
                    : "Create Loan"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-600 text-white bg-transparent"
                  onClick={handleRepayLoan}
                  disabled={repayLoan.isPending}
                >
                  {repayLoan.isPending ? "Repaying..." : "Repay Loan"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderYieldContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gray-900/70 text-center">
          <p className="text-gray-400 text-sm">Active Strategies</p>
          <p className="text-2xl font-bold text-purple-400">2</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-900/70 text-center">
          <p className="text-gray-400 text-sm">Total Value</p>
          <p className="text-2xl font-bold text-white">$185,000</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-900/70 text-center">
          <p className="text-gray-400 text-sm">Avg. APY</p>
          <p className="text-2xl font-bold text-green-400">10.2%</p>
        </div>
      </div>

      <div className="space-y-4">
        {yieldStrategies.map((strategy, index) => (
          <div
            key={index}
            className="p-6 rounded-lg bg-gray-900/60 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {strategy.name}
                </h3>
                <p className="text-gray-400 text-sm">{strategy.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">
                  {strategy.apy}
                </p>
                <p className="text-gray-400 text-sm">APY</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-xs">Total Value Locked</p>
                <p className="text-white font-medium">{strategy.tvl}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Risk Level</p>
                <p
                  className={`font-medium ${
                    strategy.risk === "Low"
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {strategy.risk}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Assets</p>
                <p className="text-white font-medium">
                  {strategy.assets.join(", ")}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 bg-purple-500 hover:bg-purple-600 text-white">
                Join Strategy
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-600 text-white bg-transparent"
              >
                Learn More
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gray-950/80 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Blend - DeFi Strategies</CardTitle>
          <p className="text-gray-400">
            Lending, borrowing, and yield optimization for your RWA portfolio
          </p>
        </CardHeader>
        <CardContent>
          {/* Strategy Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-900/70 p-1 rounded-lg">
            <button
              onClick={() => setActiveStrategy("lend")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeStrategy === "lend"
                  ? "bg-green-500/20 text-green-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              Lending
            </button>
            <button
              onClick={() => setActiveStrategy("borrow")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeStrategy === "borrow"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ArrowDownRight className="h-4 w-4" />
              Borrowing
            </button>
            <button
              onClick={() => setActiveStrategy("yield")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeStrategy === "yield"
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Yield Strategies
            </button>
          </div>

          {/* Content based on active strategy */}
          {activeStrategy === "lend" && renderLendingContent()}
          {activeStrategy === "borrow" && renderBorrowingContent()}
          {activeStrategy === "yield" && renderYieldContent()}
        </CardContent>
      </Card>
    </div>
  );
}
