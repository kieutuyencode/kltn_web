"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getEventDetail, getMySchedule, getMyTicketType } from "~/api";
import { formatPrice } from "~/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SummaryPage({ params }: PageProps) {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const eventId = id as string;
  const scheduleId = searchParams.get("scheduleId");

  const eventQuery = useQuery({
    queryKey: getEventDetail.queryKey(Number(eventId || 0)),
    queryFn: () => getEventDetail(Number(eventId || 0)),
    enabled: !!eventId,
  });

  const schedulesQuery = useQuery({
    queryKey: getMySchedule.queryKey(Number(eventId || 0)),
    queryFn: () => getMySchedule(Number(eventId || 0)),
    enabled: !!eventId,
  });

  const ticketTypesQuery = useQuery({
    queryKey: getMyTicketType.queryKey(Number(scheduleId || 0)),
    queryFn: () => getMyTicketType(Number(scheduleId || 0)),
    enabled: !!scheduleId,
  });

  const event = eventQuery.data?.data;
  const schedules = schedulesQuery.data?.data || [];
  const selectedSchedule = schedules.find((s) => s.id === Number(scheduleId));
  const ticketTypes = ticketTypesQuery.data?.data || [];

  // Calculate statistics
  const totalRevenue = ticketTypes.reduce((sum, type) => {
    const sold = type.originalQuantity - type.remainingQuantity;
    return sum + Number(type.price) * sold;
  }, 0);

  const totalTicketsSold = ticketTypes.reduce((sum, type) => {
    return sum + (type.originalQuantity - type.remainingQuantity);
  }, 0);

  const totalTickets = ticketTypes.reduce((sum, type) => {
    return sum + type.originalQuantity;
  }, 0);

  const totalRevenueTarget = ticketTypes.reduce((sum, type) => {
    return sum + Number(type.price) * type.originalQuantity;
  }, 0);

  const revenuePercentage =
    totalRevenueTarget > 0
      ? Math.round((totalRevenue / totalRevenueTarget) * 100)
      : 0;
  const ticketsPercentage =
    totalTickets > 0 ? Math.round((totalTicketsSold / totalTickets) * 100) : 0;

  if (!eventId || !event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vui lòng chọn sự kiện</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Doanh thu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Card */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Doanh thu</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold">
                  {formatPrice(totalRevenue)}đ
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tổng: {formatPrice(totalRevenueTarget)}đ
                </p>
              </div>
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 40 * (1 - revenuePercentage / 100)
                    }`}
                    className="text-yellow-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {revenuePercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tickets Sold Card */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Số vé đã bán</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold">{totalTicketsSold} vé</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tổng: {totalTickets} vé
                </p>
              </div>
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 40 * (1 - ticketsPercentage / 100)
                    }`}
                    className="text-yellow-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {ticketsPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart Section */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm">Doanh thu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-sm">Số vé bán</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              24 giờ
            </button>
            <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded">
              30 ngày
            </button>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center border-t pt-4">
          <p className="text-muted-foreground">
            Biểu đồ xu hướng (sẽ được tích hợp sau)
          </p>
        </div>
      </div>

      {/* Ticket Details Table */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Chi tiết</h3>
        <p className="text-sm text-muted-foreground mb-4">Vé đã bán</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Loại vé</th>
                <th className="text-left p-3">Giá bán</th>
                <th className="text-left p-3">Đã bán</th>
                <th className="text-left p-3">Bị khoá</th>
                <th className="text-left p-3">Tỉ lệ bán</th>
              </tr>
            </thead>
            <tbody>
              {ticketTypes.map((type) => {
                const sold = type.originalQuantity - type.remainingQuantity;
                const salesRatio =
                  type.originalQuantity > 0
                    ? Math.round((sold / type.originalQuantity) * 100)
                    : 0;
                return (
                  <tr key={type.id} className="border-b">
                    <td className="p-3">{type.name}</td>
                    <td className="p-3">{formatPrice(Number(type.price))}đ</td>
                    <td className="p-3">
                      {sold}/{type.originalQuantity}
                    </td>
                    <td className="p-3">0</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500"
                            style={{ width: `${salesRatio}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{salesRatio}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {ticketTypes.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-3 text-center text-muted-foreground"
                  >
                    Chưa có loại vé nào
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
