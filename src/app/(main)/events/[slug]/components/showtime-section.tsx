"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider, Contract, Eip1193Provider } from "ethers";
import { toast } from "sonner";
import {
  CardContent,
  Button,
  Badge,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Input,
} from "~/components";
import { formatPrice, toUnits, formatDateOnly, formatTime } from "~/utils";
import {
  EVENT_CONTRACT_ADDRESS,
  EVENT_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
} from "~/constants/blockchain.constant";
import { postBuyTicket, getPublicEventDetail } from "~/api/event";

interface Ticket {
  id: number;
  name: string;
  price: number;
  soldOut: boolean;
  remainingQuantity: number;
}

interface Showtime {
  id: string;
  scheduleId: number;
  time: string;
  date: string;
  startDate: string;
  endDate: string;
  tickets: Ticket[];
}

interface ShowtimeSectionProps {
  showtimes: Showtime[];
  slug: string;
}

// Helper function to format date and time range
const formatDateTimeRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check if same day
  const isSameDay =
    start.getDate() === end.getDate() &&
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  const startTime = formatTime(startDate);
  const endTime = formatTime(endDate);

  if (isSameDay) {
    // Same day: "giờ:phút - giờ:phút, ngày"
    return `${startTime} - ${endTime}, ${formatDateOnly(startDate)}`;
  } else {
    // Different days: "giờ:phút, ngày - giờ:phút, ngày"
    return `${startTime}, ${formatDateOnly(
      startDate
    )} - ${endTime}, ${formatDateOnly(endDate)}`;
  }
};

export function ShowtimeSection({ showtimes, slug }: ShowtimeSectionProps) {
  const queryClient = useQueryClient();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleQuantityChange = (
    ticketId: number,
    quantity: number,
    maxQuantity: number
  ) => {
    if (quantity < 1) return;
    if (quantity > maxQuantity) {
      toast.warning(`Chỉ còn ${maxQuantity} vé`);
      return;
    }
    setQuantities((prev) => ({
      ...prev,
      [ticketId]: quantity,
    }));
  };

  const handleBuyTicket = async (
    ticketTypeId: number,
    scheduleId: number,
    price: number,
    quantity: number,
    remainingQuantity: number
  ) => {
    if (!isConnected || !address) {
      toast.error("Vui lòng kết nối ví trước");
      return;
    }

    if (!quantity || quantity < 1) {
      toast.error("Vui lòng chọn số lượng vé");
      return;
    }

    if (quantity > remainingQuantity) {
      toast.error(`Chỉ còn ${remainingQuantity} vé`);
      return;
    }

    const key = `${ticketTypeId}-${scheduleId}`;
    setLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const provider = new BrowserProvider(walletProvider as Eip1193Provider);
      const signer = await provider.getSigner();

      // Calculate token amount (price * quantity)
      const tokenAmount = toUnits(price * quantity); // Convert to wei

      // Check and approve token allowance
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const currentAllowance = await tokenContract.allowance(
        address,
        EVENT_CONTRACT_ADDRESS
      );

      if (currentAllowance < tokenAmount) {
        const approveTx = await tokenContract.approve(
          EVENT_CONTRACT_ADDRESS,
          tokenAmount
        );
        await approveTx.wait();
      }

      // Buy ticket
      const eventContract = new Contract(
        EVENT_CONTRACT_ADDRESS,
        EVENT_CONTRACT_ABI,
        signer
      );

      const tx = await eventContract.buyTicket(
        ticketTypeId,
        quantity,
        tokenAmount,
        scheduleId
      );

      toast.success("Giao dịch đã được gửi, đang chờ xác nhận...");
      const receipt = await tx.wait();

      // Call API to save transaction to database
      const txHash = tx.hash || receipt?.hash;
      if (txHash) {
        try {
          await postBuyTicket({ paymentTxhash: txHash });
          toast.success("Mua vé thành công!");

          // Invalidate query to refresh event data and update ticket quantities
          queryClient.invalidateQueries({
            queryKey: getPublicEventDetail.queryKey(slug),
          });
        } catch (apiError: any) {
          console.error("Error calling buy ticket API:", apiError);
          toast.error(
            apiError?.response?.data?.message ||
              "Giao dịch blockchain thành công nhưng có lỗi khi lưu vào hệ thống"
          );
          // Don't return here, still reset quantity
        }
      } else {
        toast.success("Mua vé thành công!");
      }
    } catch (error: any) {
      console.error("Error buying ticket:", error);
      if (error?.info?.error?.code === 4001) {
        toast.error("Giao dịch bị từ chối");
      } else {
        toast.error(error?.message || "Có lỗi xảy ra khi mua vé");
      }
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <Accordion type="multiple" className="w-full space-y-2">
      {showtimes.map((showtime) => (
        <AccordionItem
          key={showtime.id}
          value={showtime.id}
          className="border border-border rounded-lg bg-card shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-4">
            <AccordionTrigger className="hover:no-underline flex-1 data-[state=open]:bg-muted/30">
              <span className="text-base font-medium text-foreground">
                {formatDateTimeRange(showtime.startDate, showtime.endDate)}
              </span>
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className="border-t border-border bg-muted/20">
              <CardContent className="p-4 space-y-3">
                {showtime.tickets.map((ticket) => {
                  const quantity = quantities[ticket.id] || 1;
                  const key = `${ticket.id}-${showtime.scheduleId}`;
                  const isLoading = loading[key] || false;

                  return (
                    <div
                      key={ticket.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-base mb-1">
                          {ticket.name}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(ticket.price)} EVT
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Còn lại: {ticket.remainingQuantity} vé
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {ticket.soldOut ? (
                          <Badge
                            variant="destructive"
                            className="text-xs px-3 py-1 whitespace-nowrap"
                          >
                            Hết vé
                          </Badge>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  handleQuantityChange(
                                    ticket.id,
                                    quantity - 1,
                                    ticket.remainingQuantity
                                  )
                                }
                                disabled={quantity <= 1}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                max={ticket.remainingQuantity}
                                value={quantity}
                                onChange={(e) => {
                                  const newQuantity =
                                    parseInt(e.target.value) || 1;
                                  handleQuantityChange(
                                    ticket.id,
                                    newQuantity,
                                    ticket.remainingQuantity
                                  );
                                }}
                                className="w-16 h-8 text-center"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  handleQuantityChange(
                                    ticket.id,
                                    quantity + 1,
                                    ticket.remainingQuantity
                                  )
                                }
                                disabled={quantity >= ticket.remainingQuantity}
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 shrink-0"
                              onClick={() =>
                                handleBuyTicket(
                                  ticket.id,
                                  showtime.scheduleId,
                                  ticket.price,
                                  quantity,
                                  ticket.remainingQuantity
                                )
                              }
                              disabled={
                                isLoading || ticket.remainingQuantity === 0
                              }
                            >
                              {isLoading ? "Đang xử lý..." : "Mua vé"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
