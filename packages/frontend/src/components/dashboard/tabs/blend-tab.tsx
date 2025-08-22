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

// Helper function to replace formatEther
const formatEther = (value: bigint): string => {
  return (Number(value) / 1e18).toString();
};

// Mock contract addresses
const CONTRACT_ADDRESSES = {
  LendingPool: "0x0000000000000000000000000000000000000000" as Address,
};

// RWA Token addresses from deployment
const RWA_TOKEN_ADDRESSES = {
  GOLD: "0x0000000000000000000000000000000000636359" as Address,
  SILVER: "0x00000000000000000000000000000000006363ad" as Address,
  REAL_ESTATE: "0x00000000000000000000000000000000006363ba" as Address,
};

export function BlendTab() {
  const [activeStrategy, setActiveStrategy] = useState("lend");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<Address>(
    RWA_TOKEN_ADDRESSES.GOLD
  );
  const [selectedCollateralToken, setSelectedCollateralToken] =
    useState<Address>(RWA_TOKEN_ADDRESSES.REAL_ESTATE);
  const [selectedBorrowToken, setSelectedBorrowToken] = useState<Address>(
    RWA_TOKEN_ADDRESSES.GOLD
  );
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [isApprovalInProgress, setIsApprovalInProgress] = useState(false);
  const [isCollateralApprovalInProgress, setIsCollateralApprovalInProgress] =
    useState(false);
  const [totalLentAmount, setTotalLentAmount] = useState(0);
  const [goldLentAmount, setGoldLentAmount] = useState(0);
  const [realEstateLentAmount, setRealEstateLentAmount] = useState(0);
  const [invoiceLentAmount, setInvoiceLentAmount] = useState(0);
  const pendingDepositAmountRef = useRef<string>("");
  const pendingDepositTokenRef = useRef<Address>(RWA_TOKEN_ADDRESSES.GOLD);
  const pendingWithdrawAmountRef = useRef<string>("");
  const pendingWithdrawTokenRef = useRef<Address>(RWA_TOKEN_ADDRESSES.GOLD);

  // Mock functions for tracking individual token amounts (localStorage removed)
  const getTokenLentFromStorage = (tokenType: string): number => {
    return 0; // Always return 0 for mock
  };

  const updateTokenLentInStorage = (
    tokenType: string,
    amount: number
  ): void => {
    console.log(`Mock: Updated ${tokenType} lent:`, amount);

    // Update state based on token type
    if (tokenType === "gold") setGoldLentAmount(amount);
    else if (tokenType === "real_estate") setRealEstateLentAmount(amount);
    else if (tokenType === "invoice") setInvoiceLentAmount(amount);

    // Recalculate total
    updateTotalFromIndividualAmounts();
  };

  const updateTotalFromIndividualAmounts = (): void => {
    const gold = getTokenLentFromStorage("gold");
    const realEstate = getTokenLentFromStorage("real_estate");
    const invoice = getTokenLentFromStorage("invoice");
    const total = gold + realEstate + invoice;

    setTotalLentAmount(total);
    console.log("Mock: Updated total lent from individual amounts:", total);
  };

  const addToTokenLent = (
    tokenAddress: Address,
    depositAmount: number
  ): void => {
    console.log(
      "addToTokenLent called with token:",
      tokenAddress,
      "amount:",
      depositAmount
    );
    let tokenType = "";
    if (tokenAddress === RWA_TOKEN_ADDRESSES.GOLD) tokenType = "gold";
    else if (tokenAddress === RWA_TOKEN_ADDRESSES.REAL_ESTATE)
      tokenType = "real_estate";
    else if (tokenAddress === RWA_TOKEN_ADDRESSES.SILVER) tokenType = "invoice"; // Silver mapped to Invoice for UI

    console.log("Mapped token type:", tokenType);

    if (tokenType) {
      const currentAmount = getTokenLentFromStorage(tokenType);
      const newAmount = currentAmount + depositAmount;
      console.log(
        `addToTokenLent called for ${tokenType} with:`,
        depositAmount
      );
      console.log(`Current ${tokenType} amount:`, currentAmount);
      console.log(`New ${tokenType} amount will be:`, newAmount);
      updateTokenLentInStorage(tokenType, newAmount);

      // Update React state to trigger UI re-render
      if (tokenType === "gold") {
        console.log(
          "Updating gold lent amount from",
          goldLentAmount,
          "to",
          newAmount
        );
        setGoldLentAmount(newAmount);
      } else if (tokenType === "real_estate") {
        console.log(
          "Updating real estate lent amount from",
          realEstateLentAmount,
          "to",
          newAmount
        );
        setRealEstateLentAmount(newAmount);
      } else if (tokenType === "invoice") {
        console.log(
          "Updating invoice lent amount from",
          invoiceLentAmount,
          "to",
          newAmount
        );
        setInvoiceLentAmount(newAmount);
      }

      // Update total amount
      const goldAmount =
        tokenType === "gold" ? newAmount : getTokenLentFromStorage("gold");
      const realEstateAmount =
        tokenType === "real_estate"
          ? newAmount
          : getTokenLentFromStorage("real_estate");
      const invoiceAmount =
        tokenType === "invoice"
          ? newAmount
          : getTokenLentFromStorage("invoice");
      const newTotal = goldAmount + realEstateAmount + invoiceAmount;
      console.log(
        "Updating total lent amount from",
        totalLentAmount,
        "to",
        newTotal
      );
      setTotalLentAmount(newTotal);
    } else {
      console.log("No token type mapped for address:", tokenAddress);
    }
  };

  const subtractFromTokenLent = (
    tokenAddress: Address,
    withdrawAmount: number
  ): void => {
    let tokenType = "";
    if (tokenAddress === RWA_TOKEN_ADDRESSES.GOLD) tokenType = "gold";
    else if (tokenAddress === RWA_TOKEN_ADDRESSES.REAL_ESTATE)
      tokenType = "real_estate";
    else if (tokenAddress === RWA_TOKEN_ADDRESSES.SILVER) tokenType = "invoice"; // Silver mapped to Invoice for UI

    if (tokenType) {
      const currentAmount = getTokenLentFromStorage(tokenType);
      const newAmount = Math.max(0, currentAmount - withdrawAmount);
      updateTokenLentInStorage(tokenType, newAmount);

      // Update React state to trigger UI re-render
      if (tokenType === "gold") {
        setGoldLentAmount(newAmount);
      } else if (tokenType === "real_estate") {
        setRealEstateLentAmount(newAmount);
      } else if (tokenType === "invoice") {
        setInvoiceLentAmount(newAmount);
      }

      // Update total amount
      const goldAmount =
        tokenType === "gold" ? newAmount : getTokenLentFromStorage("gold");
      const realEstateAmount =
        tokenType === "real_estate"
          ? newAmount
          : getTokenLentFromStorage("real_estate");
      const invoiceAmount =
        tokenType === "invoice"
          ? newAmount
          : getTokenLentFromStorage("invoice");
      const newTotal = goldAmount + realEstateAmount + invoiceAmount;
      setTotalLentAmount(newTotal);
    }
  };

  // Mock legacy functions for backward compatibility
  const getTotalLentFromStorage = (): number => {
    return 0; // Always return 0 for mock
  };

  const addToTotalLent = (depositAmount: number): void => {
    // This function is now handled by addToTokenLent
    console.log("addToTotalLent called (legacy) with:", depositAmount);
  };

  const subtractFromTotalLent = (withdrawAmount: number): void => {
    // This function is now handled by subtractFromTokenLent
    console.log("subtractFromTotalLent called (legacy) with:", withdrawAmount);
  };

  // Initialize individual token amounts from local storage on component mount
  useEffect(() => {
    const goldAmount = getTokenLentFromStorage("gold");
    const realEstateAmount = getTokenLentFromStorage("real_estate");
    const invoiceAmount = getTokenLentFromStorage("invoice");

    console.log("Initializing token amounts from storage:");
    console.log("Gold:", goldAmount);
    console.log("Real Estate:", realEstateAmount);
    console.log("Invoice:", invoiceAmount);

    setGoldLentAmount(goldAmount);
    setRealEstateLentAmount(realEstateAmount);
    setInvoiceLentAmount(invoiceAmount);

    // Calculate and set total
    const total = goldAmount + realEstateAmount + invoiceAmount;
    setTotalLentAmount(total);

    // Mock: Total calculated but not stored
    console.log("Mock: Total lent calculated:", total);
  }, []);

  // Mock hook implementations
  const deposit = {
    write: () => {
      toast.success("Deposit transaction submitted!");
      // Simulate adding to local storage
      const amount = parseFloat(depositAmount);
      if (amount > 0) {
        addToTokenLent(selectedToken, amount);
        setDepositAmount("");
      }
    },
    isLoading: false,
    isConfirmed: false,
    error: null,
  };

  const withdraw = {
    write: () => {
      toast.success("Withdrawal transaction submitted!");
      // Simulate subtracting from local storage
      const amount = parseFloat(withdrawAmount);
      if (amount > 0) {
        subtractFromTokenLent(selectedToken, amount);
        setWithdrawAmount("");
      }
    },
    isLoading: false,
    isConfirmed: false,
    error: null,
  };

  const createLoan = {
    write: () => {
      toast.success("Loan creation transaction submitted!");
      setBorrowAmount("");
      setCollateralAmount("");
    },
    isLoading: false,
  };

  const repayLoan = {
    write: () => {
      toast.success("Loan repayment transaction submitted!");
      setRepayAmount("");
      setSelectedLoanId("");
    },
    isLoading: false,
  };

  // Mock deposit data
  const goldDeposits = { data: BigInt("1000000000000000000000"), isLoading: false };
  const silverDeposits = { data: BigInt("500000000000000000000"), isLoading: false };
  const realEstateDeposits = { data: BigInt("2000000000000000000000"), isLoading: false };

  // Mock token data
  const tokenAllowance = { data: BigInt("0"), isLoading: false };
  const tokenApproval = {
    write: () => {
      toast.success("Token approval submitted!");
      setIsApprovalInProgress(false);
    },
    isLoading: false,
  };
  const tokenBalance = { data: BigInt("10000000000000000000000"), isLoading: false };

  // Mock collateral data
  const collateralAllowance = { data: BigInt("0"), isLoading: false };
  const collateralApproval = {
    write: () => {
      toast.success("Collateral approval submitted!");
      setIsCollateralApprovalInProgress(false);
    },
    isLoading: false,
  };

  // Calculate total deposits across all tokens
  const calculateTotalDeposits = () => {
    // Convert BigInt to number (mock data is in wei, so divide by 10^18)
    const gold = goldDeposits.data ? Number(goldDeposits.data) / 1e18 : 0;
    const silver = silverDeposits.data ? Number(silverDeposits.data) / 1e18 : 0;
    const realEstate = realEstateDeposits.data ? Number(realEstateDeposits.data) / 1e18 : 0;
    return gold + silver + realEstate;
  };

  const totalDeposits = calculateTotalDeposits();
  const isLoadingDeposits =
    goldDeposits.isLoading ||
    silverDeposits.isLoading ||
    realEstateDeposits.isLoading;

  // Handle deposit success/error
  useEffect(() => {
    console.log(
      "Deposit useEffect triggered - isConfirmed:",
      deposit.isConfirmed,
      "error:",
      deposit.error,
      "pendingAmount:",
      pendingDepositAmountRef.current
    );
    if (deposit.isConfirmed) {
      // Clear the refs and show success message (local storage already updated when transaction was submitted)
      if (pendingDepositAmountRef.current) {
        console.log("Deposit confirmed! Transaction successful.");

        // Clear the refs and show success message
        pendingDepositAmountRef.current = "";
        pendingDepositTokenRef.current = RWA_TOKEN_ADDRESSES.GOLD; // Reset to default
        toast.success("Deposit successful! Your balance has been updated.");
      } else {
        console.log("Deposit confirmed but no pending amount in ref!");
      }
    }
    if (deposit.error) {
      console.log("Deposit error:", deposit.error.message);
      toast.error(`Deposit failed: ${deposit.error.message}`);
      pendingDepositAmountRef.current = ""; // Clear on error
      pendingDepositTokenRef.current = RWA_TOKEN_ADDRESSES.GOLD; // Reset to default
    }
  }, [deposit.isConfirmed, deposit.error, selectedToken]);

  // Handle withdraw success/error
  useEffect(() => {
    if (withdraw.isConfirmed) {
      // Subtract withdrawn amount from local storage
      if (pendingWithdrawAmountRef.current) {
        const amount = parseFloat(pendingWithdrawAmountRef.current);
        const tokenUsed = pendingWithdrawTokenRef.current;
        subtractFromTokenLent(tokenUsed, amount);
        console.log(
          "Subtracted from token lent:",
          amount,
          "for token:",
          tokenUsed,
          "New total:",
          getTotalLentFromStorage()
        );
        pendingWithdrawAmountRef.current = ""; // Clear the refs
        pendingWithdrawTokenRef.current = RWA_TOKEN_ADDRESSES.GOLD; // Reset to default
      }
      toast.success("Withdrawal successful!");
      setWithdrawAmount("");
    }
    if (withdraw.error) {
      toast.error(`Withdrawal failed: ${withdraw.error.message}`);
      pendingWithdrawAmountRef.current = ""; // Clear the refs on error too
      pendingWithdrawTokenRef.current = RWA_TOKEN_ADDRESSES.GOLD; // Reset to default
    }
  }, [withdraw.isConfirmed, withdraw.error]);

  // Handle loan creation success/error
  useEffect(() => {
    if (createLoan.isConfirmed) {
      toast.success("Loan created successfully!");
      setBorrowAmount("");
      setCollateralAmount("");
    }
    if (createLoan.error) {
      toast.error(`Loan creation failed: ${createLoan.error.message}`);
    }
  }, [createLoan.isConfirmed, createLoan.error]);

  // Handle loan repayment success/error
  useEffect(() => {
    if (repayLoan.isConfirmed) {
      toast.success("Loan repayment successful!");
      setRepayAmount("");
    }
    if (repayLoan.error) {
      toast.error(`Loan repayment failed: ${repayLoan.error.message}`);
    }
  }, [repayLoan.isConfirmed, repayLoan.error]);

  // Handle token approval success/error and auto-trigger deposit
  useEffect(() => {
    if (tokenApproval.isConfirmed && isApprovalInProgress) {
      toast.success("Token approval successful! You can now deposit.");
      setIsApprovalInProgress(false);
      // Auto-trigger deposit after successful approval
      if (pendingDepositAmountRef.current) {
        try {
          const amount = parseEther(pendingDepositAmountRef.current);
          const tokenToUse = pendingDepositTokenRef.current;
          console.log(
            "Auto-triggering deposit with amount from ref:",
            pendingDepositAmountRef.current,
            "for token:",
            tokenToUse
          );
          deposit.deposit(tokenToUse, amount);

          toast.success("deposit successful.");

          // Update local storage after 3 second delay
          setTimeout(() => {
            const depositAmountValue = parseFloat(
              pendingDepositAmountRef.current
            );
            console.log(
              "Updating local storage after 3s delay with amount:",
              depositAmountValue,
              "for token:",
              tokenToUse
            );
            addToTokenLent(tokenToUse, depositAmountValue);
            console.log(
              "Local storage updated after delay. New total:",
              getTotalLentFromStorage()
            );
          }, 3000);
          setDepositAmount("");
        } catch (error) {
          toast.error("Invalid amount");
          pendingDepositAmountRef.current = ""; // Clear on error
          pendingDepositTokenRef.current = RWA_TOKEN_ADDRESSES.GOLD; // Reset to default
        }
      } else {
        console.log(
          "No pending deposit amount found in ref during approval success!"
        );
      }
    }
    if (tokenApproval.error && isApprovalInProgress) {
      toast.error(`Token approval failed: ${tokenApproval.error.message}`);
      setIsApprovalInProgress(false);
      pendingDepositAmountRef.current = ""; // Clear on error
      pendingDepositTokenRef.current = RWA_TOKEN_ADDRESSES.GOLD; // Reset to default
    }
  }, [
    tokenApproval.isConfirmed,
    tokenApproval.error,
    isApprovalInProgress,
    selectedToken,
    deposit,
  ]);

  // Handle collateral approval success/error and auto-trigger loan creation
  useEffect(() => {
    if (collateralApproval.isConfirmed && isCollateralApprovalInProgress) {
      toast.success(
        "Collateral approval successful! You can now create a loan."
      );
      setIsCollateralApprovalInProgress(false);
      // Auto-trigger loan creation after successful approval
      if (collateralAmount && borrowAmount) {
        try {
          const collateralAmountBigInt = parseEther(collateralAmount);
          const borrowAmountBigInt = parseEther(borrowAmount);
          createLoan.createLoan(
            selectedCollateralToken,
            selectedBorrowToken,
            collateralAmountBigInt,
            borrowAmountBigInt
          );
        } catch (error) {
          toast.error("Invalid amounts");
        }
      }
    }
    if (collateralApproval.error && isCollateralApprovalInProgress) {
      toast.error(
        `Collateral approval failed: ${collateralApproval.error.message}`
      );
      setIsCollateralApprovalInProgress(false);
    }
  }, [
    collateralApproval.isConfirmed,
    collateralApproval.error,
    isCollateralApprovalInProgress,
    collateralAmount,
    borrowAmount,
    selectedCollateralToken,
    selectedBorrowToken,
    createLoan,
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
      console.log(
        "handleDeposit: Stored deposit amount in ref:",
        depositAmount,
        "for token:",
        selectedToken
      );
      console.log("handleDeposit: Token addresses for reference:");
      console.log("GOLD:", RWA_TOKEN_ADDRESSES.GOLD);
      console.log("SILVER:", RWA_TOKEN_ADDRESSES.SILVER);
      console.log("REAL_ESTATE:", RWA_TOKEN_ADDRESSES.REAL_ESTATE);

      // Always trigger approval first to ensure two-step process
      // This will show approval popup first, then auto-trigger deposit
      setIsApprovalInProgress(true);
      tokenApproval.approve(CONTRACT_ADDRESSES.LendingPool, amount);
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

      withdraw.withdraw(selectedToken, amount);
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
      collateralApproval.approve(
        CONTRACT_ADDRESSES.LendingPool,
        collateralAmountBigInt
      );
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
      repayLoan.repayLoan(loanId, amount);
      toast.info("Loan repayment transaction submitted...");
    } catch (error) {
      toast.error("Invalid amount or loan ID");
    }
  };

  const lendingOpportunities = [
    {
      asset: "Real Estate Token",
      symbol: "RET",
      apy: "8.5%",
      totalLent: `$${realEstateLentAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      available: "$2.5M",
      risk: "Low",
    },
    {
      asset: "Gold Commodity",
      symbol: "GOLD",
      apy: "6.2%",
      totalLent: `$${goldLentAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      available: "$1.8M",
      risk: "Low",
    },
    {
      asset: "Invoice Token",
      symbol: "INV",
      apy: "12.3%",
      totalLent: `$${invoiceLentAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      available: "$850K",
      risk: "Medium",
    },
  ];

  const borrowingOptions = [
    {
      asset: "USDC",
      collateral: "Real Estate Token",
      ltv: "75%",
      interestRate: "5.8%",
      borrowed: "$93,750",
      available: "$31,250",
    },
    {
      asset: "HBAR",
      collateral: "Gold Commodity",
      ltv: "70%",
      interestRate: "7.2%",
      borrowed: "$66,675",
      available: "$28,575",
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
            $
            {totalLentAmount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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
                  <option value={RWA_TOKEN_ADDRESSES.GOLD}>
                    GOLD Token (HVGLD)
                  </option>
                  <option value={RWA_TOKEN_ADDRESSES.SILVER}>
                    SILVER Token (HVSILV)
                  </option>
                  <option value={RWA_TOKEN_ADDRESSES.REAL_ESTATE}>
                    REAL ESTATE Token (HVRE)
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

  const renderBorrowingContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-gray-900/70 text-center">
          <p className="text-gray-400 text-sm">Total Borrowed</p>
          <p className="text-2xl font-bold text-blue-400">$160,425</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-900/70 text-center">
          <p className="text-gray-400 text-sm">Available to Borrow</p>
          <p className="text-2xl font-bold text-white">$59,825</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-900/70 text-center">
          <p className="text-gray-400 text-sm">Health Factor</p>
          <p className="text-2xl font-bold text-green-400">2.1</p>
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
                    <option value={RWA_TOKEN_ADDRESSES.GOLD}>
                      GOLD Token (HVGLD)
                    </option>
                    <option value={RWA_TOKEN_ADDRESSES.SILVER}>
                      SILVER Token (HVSILV)
                    </option>
                    <option value={RWA_TOKEN_ADDRESSES.REAL_ESTATE}>
                      REAL ESTATE Token (HVRE)
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
                    <option value={RWA_TOKEN_ADDRESSES.GOLD}>
                      GOLD Token (HVGLD)
                    </option>
                    <option value={RWA_TOKEN_ADDRESSES.SILVER}>
                      SILVER Token (HVSILV)
                    </option>
                    <option value={RWA_TOKEN_ADDRESSES.REAL_ESTATE}>
                      REAL ESTATE Token (HVRE)
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
