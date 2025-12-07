"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Mail } from "lucide-react";
import { Button, Input } from "~/components";
import { getMyPaymentTicket } from "~/api";
import { formatPrice, formatDate, formatTime } from "~/utils";
import type { TPaymentTicket } from "~/types";
import { useAuthStore } from "~/stores";

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return `${formatTime(dateString)}, ${formatDate(dateString)}`;
};

export default function OrdersPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const eventId = id as string;
  const scheduleId = searchParams.get("scheduleId");
  const authStore = useAuthStore();
  const isAuthenticated = !!authStore.userAccessToken;
  const [searchQuery, setSearchQuery] = useState("");

  // Get all payment tickets for this event/schedule
  const paymentTicketsQuery = useQuery({
    queryKey: ["organizer", "orders", eventId, scheduleId],
    queryFn: async () => {
      const response = await getMyPaymentTicket({});
      const tickets = response.data?.rows || [];

      // Filter by eventId and scheduleId if provided
      return tickets.filter((ticket: TPaymentTicket) => {
        if (eventId && ticket.eventId !== Number(eventId)) return false;
        if (scheduleId && ticket.scheduleId !== Number(scheduleId))
          return false;
        return true;
      });
    },
    enabled: isAuthenticated && !!eventId,
  });

  const orders: TPaymentTicket[] = paymentTicketsQuery.data || [];
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.paymentTxhash?.toLowerCase().includes(query) ||
      order.user?.email?.toLowerCase().includes(query) ||
      order.user?.fullName?.toLowerCase().includes(query) ||
      order.event?.name?.toLowerCase().includes(query)
    );
  });

  // Calculate totals
  const totalOrders = filteredOrders.length;
  const giftOrders = filteredOrders.filter((o) => !o.userId).length;

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vui lòng đăng nhập</p>
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vui lòng chọn sự kiện</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Danh sách đơn hàng</h2>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <Button className="bg-primary hover:bg-primary/90">Đơn hàng</Button>
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Tìm đơn hàng"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="bg-primary hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Mail className="w-4 h-4 mr-2" />
            Gửi email
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Có {totalOrders} đơn hàng (và {giftOrders} đơn tặng)
      </div>

      {/* Orders Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="p-3 text-left">Mã đơn hàng</th>
                <th className="p-3 text-left">Ngày tạo đơn</th>
                <th className="p-3 text-left">Người mua</th>
                <th className="p-3 text-left">Giá trị đơn</th>
                <th className="p-3 text-left">Phương thức thanh toán</th>
                <th className="p-3 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paymentTicketsQuery.isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="p-3 font-mono text-sm">
                      {order.paymentTxhash.substring(0, 10)}...
                    </td>
                    <td className="p-3">{formatDateTime(order.createdAt)}</td>
                    <td className="p-3">
                      {order.user?.fullName || order.user?.email || "Khách"}
                    </td>
                    <td className="p-3 font-semibold">
                      {formatPrice(Number(order.tokenAmount))} EVT
                    </td>
                    <td className="p-3">Blockchain</td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm">
                        Xem chi tiết
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <p className="text-muted-foreground font-medium">
                        No data
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
