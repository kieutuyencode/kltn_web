"use client";

import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useDisconnect,
} from "@reown/appkit/react";
import { useMutation } from "@tanstack/react-query";
import { BrowserProvider, Eip1193Provider } from "ethers";
import { PanelLeft } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { toast } from "sonner";
import { postSignInWallet } from "~/api";
import { Button, Separator, useSidebar } from "~/components";
import { useAuthStore } from "~/stores";
import { createSiweMessage } from "~/utils";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

const getEthereumProvider = (): EthereumProvider | null => {
  if (typeof window === "undefined") return null;
  const provider = window.ethereum as unknown;
  if (
    provider &&
    typeof provider === "object" &&
    "request" in provider &&
    typeof (provider as { request: unknown }).request === "function"
  ) {
    return provider as EthereumProvider;
  }
  return null;
};

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAppKitAccount();
  const authStore = useAuthStore();
  const postSignInWalletMutation = useMutation({
    mutationFn: postSignInWallet,
  });
  const { walletProvider } = useAppKitProvider("eip155");

  useEffect(() => {
    const signInWallet = async () => {
      if (address && isConnected && !authStore.walletAccessToken) {
        try {
          const provider = new BrowserProvider(
            walletProvider as Eip1193Provider
          );
          const message = createSiweMessage(address);
          const signer = await provider.getSigner();
          const signature = await signer.signMessage(message);

          const response = await postSignInWalletMutation.mutateAsync({
            message,
            signature,
          });
          authStore.setWalletAccessToken(response.data.accessToken);

          toast.success("Kết nối ví thành công");
        } catch (error) {
          disconnect();
          console.error("Error signing in wallet:", error);
        }
      }

      if (!isConnected) {
        authStore.setWalletAccessToken(null);
      }
    };

    const timeout = setTimeout(() => {
      signInWallet();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [address, isConnected, authStore.walletAccessToken, walletProvider]);

  const shortenAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const ensureChain = async () => {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      return;
    }

    // const chainId = "0x61"; // BSC Testnet chain ID in hex

    // try {
    //   // Try to switch to the chain
    //   await ethereum.request({
    //     method: "wallet_switchEthereumChain",
    //     params: [{ chainId }],
    //   });
    // } catch (switchError: any) {
    //   // This error code indicates that the chain has not been added to MetaMask
    //   if (switchError.code === 4902) {
    //     try {
    //       // Add the chain
    //       await ethereum.request({
    //         method: "wallet_addEthereumChain",
    //         params: [
    //           {
    //             chainId,
    //             chainName: "BNB Smart Chain Testnet",
    //             nativeCurrency: {
    //               name: "Binance Chain Native Token",
    //               symbol: "tBNB",
    //               decimals: 18,
    //             },
    //             rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    //             blockExplorerUrls: ["https://testnet.bscscan.com"],
    //           },
    //         ],
    //       });
    //     } catch (addError) {
    //       console.error("Error adding chain:", addError);
    //     }
    //   } else {
    //     console.error("Error switching chain:", switchError);
    //   }
    // }

    const chainId = "0xaa36a7"; // Sepolia Testnet chain ID in hex

    try {
      // Try to switch to the chain
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add the chain
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId,
                chainName: "Sepolia Testnet",
                nativeCurrency: {
                  name: "Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [
                  "https://api.zan.top/node/v1/eth/sepolia/01d12cb5e45e43b6b9c0575538496148",
                ],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        } catch (addError) {
          console.error("Error adding chain:", addError);
        }
      } else {
        console.error("Error switching chain:", switchError);
      }
    }
  };

  const handleConnect = async () => {
    await ensureChain();
    open();
  };

  return (
    <header className="bg-background flex items-center gap-4 border-b p-4">
      <Button className="h-8 w-8" variant="ghost" onClick={toggleSidebar}>
        <PanelLeft className="w-6 h-6" />
      </Button>

      <Separator orientation="vertical" className="h-4" />

      <Image src="/logo.png" alt="Logo" width={32} height={32} />

      <Button className="ml-auto" onClick={handleConnect}>
        {isConnected && address ? shortenAddress(address) : "Kết nối ví"}
      </Button>
    </header>
  );
}
