import { useReadContract, useWriteContract } from "wagmi";
import { Address } from "viem";

// Standard ERC20 ABI for the functions we need
const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export function useERC20(tokenAddress: Address) {
  const { writeContract, isPending, error } = useWriteContract();

  // Get token balance for a specific account
  const useBalance = (account: Address) => {
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account],
    });
  };

  // Get allowance for a specific owner and spender
  const useAllowance = (owner: Address, spender: Address) => {
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [owner, spender],
    });
  };

  // Approve spender to spend amount
  const approve = (spender: Address, amount: bigint) => {
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, amount],
    });
  };

  return {
    useBalance,
    useAllowance,
    approve,
    isPending,
    error,
    tokenAddress,
  };
}