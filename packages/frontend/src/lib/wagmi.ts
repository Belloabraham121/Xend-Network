import {
  getDefaultWallets,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import { rabbyWallet } from "@rainbow-me/rainbowkit/wallets";
import { mainnet, polygon, optimism, arbitrum, base } from "viem/chains";
import { createConfig, http } from "wagmi";
import { defineChain } from "viem";

// Define Mantle Testnet
const mantleTestnet = defineChain({
  id: 5003,
  name: "Mantle Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "MNT",
    symbol: "MNT",
  },
  rpcUrls: {
    default: {
      http: [
        "https://mantle-sepolia.g.alchemy.com/v2/Kh0Fgt5Vf2vfAz0CvUT1KHKHICZ-RGlh",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Explorer",
      url: "https://explorer.sepolia.mantle.xyz",
    },
  },
  testnet: true,
});

const { wallets } = getDefaultWallets();

const connectors = connectorsForWallets(
  [
    ...wallets,
    {
      groupName: "Other",
      wallets: [rabbyWallet],
    },
  ],
  {
    appName: "Xend Network",
    projectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
      "2f5a2b1c8d3e4f5a6b7c8d9e0f1a2b3c", // Fallback for development
  }
);

export const config = createConfig({
  connectors,
  chains: [mantleTestnet, mainnet, polygon, optimism, arbitrum, base],
  transports: {
    [mantleTestnet.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
});
