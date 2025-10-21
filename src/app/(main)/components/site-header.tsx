"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { PanelLeft } from "lucide-react";
import Image from "next/image";
import { Button, Separator, useSidebar } from "~/components";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  const shortenAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="bg-background flex items-center gap-4 border-b p-4">
      <Button className="h-8 w-8" variant="ghost" onClick={toggleSidebar}>
        <PanelLeft className="w-6 h-6" />
      </Button>

      <Separator orientation="vertical" className="h-4" />

      <Image src="/logo.png" alt="Logo" width={32} height={32} />

      <Button className="ml-auto" onClick={() => open()}>
        {isConnected && address ? shortenAddress(address) : "Kết nối ví"}
      </Button>
    </header>
  );
}
