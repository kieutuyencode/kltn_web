"use client";

import { ReactNode } from "react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { Env } from "~/constants";

export const bscTestnet = defineChain({
  id: 97,
  caipNetworkId: "eip155:97",
  chainNamespace: "eip155",
  name: "BNB Smart Chain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Binance Chain Native Token",
    symbol: "tBNB",
  },
  rpcUrls: {
    default: {
      http: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "BscScan",
      url: "https://testnet.bscscan.com",
    },
  },
});

export const sepoliaTestnet = defineChain({
  id: 11155111,
  caipNetworkId: "eip155:11155111",
  chainNamespace: "eip155",
  name: "Sepolia Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [
        "https://api.zan.top/node/v1/eth/sepolia/01d12cb5e45e43b6b9c0575538496148",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
    },
  },
});

createAppKit({
  adapters: [new EthersAdapter()],
  networks: [sepoliaTestnet],
  defaultNetwork: sepoliaTestnet,
  projectId: Env.NEXT_PUBLIC_REOWN_PROJECT_ID,
  features: {
    socials: false,
    email: false,
    analytics: false,
  },
});

export const AppKitProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};
