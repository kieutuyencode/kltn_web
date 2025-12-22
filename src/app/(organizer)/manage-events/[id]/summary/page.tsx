"use client";

import { useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getEventDetail, getMySchedule, getRevenueStatistics } from "~/api";
import { formatPrice } from "~/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SummaryPage({ params }: PageProps) {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const eventId = id as string;
  const scheduleId = searchParams.get("scheduleId");
  const [period, setPeriod] = useState<"24h" | "30d">("24h");

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

  const revenueStatisticsQuery = useQuery({
    queryKey: getRevenueStatistics.queryKey({
      scheduleId: Number(scheduleId || 0),
      period,
    }),
    queryFn: () =>
      getRevenueStatistics({
        scheduleId: Number(scheduleId || 0),
        period,
      }),
    enabled: !!scheduleId,
  });

  const event = eventQuery.data?.data;
  const schedules = schedulesQuery.data?.data || [];
  const selectedSchedule = schedules.find((s) => s.id === Number(scheduleId));
  const revenueStats = revenueStatisticsQuery.data?.data;

  const overview = revenueStats?.overview;
  const chartData = revenueStats?.chart || [];
  const details = revenueStats?.details || [];

  const totalRevenue = overview ? Number(overview.totalRevenue) : 0;
  const totalRevenueTarget = overview ? Number(overview.totalRevenueTarget) : 0;
  const totalTicketsSold = overview?.totalTicketsSold || 0;
  const totalTickets = overview?.totalTicketsTarget || 0;
  const revenuePercentage = overview
    ? Math.round(overview.revenueRate * 100)
    : 0;
  const ticketsPercentage = overview
    ? Math.round(overview.ticketsRate * 100)
    : 0;

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
        <h2 className="text-2xl font-bold mb-4">Tổng quan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Card */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Doanh thu</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold">
                  {formatPrice(totalRevenue)} EVT
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tổng: {formatPrice(totalRevenueTarget)} EVT
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
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#dc2626" }}
                ></div>
                <span className="text-sm font-medium">Doanh thu</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#f87171" }}
                ></div>
                <span className="text-sm font-medium">Số vé bán</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod("24h")}
                className={`px-4 py-2 text-sm border rounded transition-colors ${
                  period === "24h"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted"
                }`}
              >
                24 giờ
              </button>
              <button
                onClick={() => setPeriod("30d")}
                className={`px-4 py-2 text-sm border rounded transition-colors ${
                  period === "30d"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted"
                }`}
              >
                30 ngày
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            (Thời gian hiển thị theo UTC)
          </p>
        </div>
        <div className="h-64 border-t pt-4">
          {revenueStatisticsQuery.isLoading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ChartContainer
              config={{
                revenue: {
                  label: "Doanh thu",
                  color: "#dc2626",
                },
                ticketsSold: {
                  label: "Số vé bán",
                  color: "#f87171",
                },
              }}
              className="h-full"
            >
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#fca5a5" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient
                    id="fillTicketsSold"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="#fb7185" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#fce7f3" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatPrice(value)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => value}
                      formatter={(value, name, item) => {
                        const formattedValue =
                          name === "revenue"
                            ? `${formatPrice(Number(value))}`
                            : `${value}`;
                        const itemConfig =
                          name === "revenue"
                            ? { label: "Doanh thu", color: "#dc2626" }
                            : { label: "Số vé bán", color: "#f87171" };
                        const indicatorColor = item.color || itemConfig.color;

                        return (
                          <>
                            <div
                              className="shrink-0 rounded-[2px] border bg-transparent h-2.5 w-2.5"
                              style={{
                                backgroundColor: indicatorColor,
                                borderColor: indicatorColor,
                              }}
                            />
                            <div className="flex flex-1 justify-between items-center leading-none">
                              <span className="text-muted-foreground">
                                {itemConfig.label}
                              </span>
                              <span className="text-foreground font-mono font-medium tabular-nums">
                                {formattedValue}
                              </span>
                            </div>
                          </>
                        );
                      }}
                    />
                  }
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#dc2626"
                  fill="url(#fillRevenue)"
                  fillOpacity={1}
                  strokeWidth={2.5}
                  name="revenue"
                  activeDot={{ r: 4, fill: "#dc2626" }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="ticketsSold"
                  stroke="#f87171"
                  fill="url(#fillTicketsSold)"
                  fillOpacity={1}
                  strokeWidth={2.5}
                  name="ticketsSold"
                  activeDot={{ r: 4, fill: "#f87171" }}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Details Table */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Chi tiết</h3>
        <p className="text-sm text-muted-foreground mb-4">Vé đã bán</p>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại vé</TableHead>
                <TableHead>Giá bán</TableHead>
                <TableHead>Đã bán</TableHead>
                <TableHead>Tỉ lệ bán</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.length > 0 ? (
                details.map((detail) => {
                  const salesRatio = Math.round(detail.salesRate * 100);
                  return (
                    <TableRow key={detail.ticketTypeId}>
                      <TableCell className="font-medium">
                        {detail.ticketTypeName}
                      </TableCell>
                      <TableCell>
                        {formatPrice(Number(detail.price))} EVT
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {detail.sold}/{detail.total}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500"
                              style={{ width: `${salesRatio}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {salesRatio}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Chưa có loại vé nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
