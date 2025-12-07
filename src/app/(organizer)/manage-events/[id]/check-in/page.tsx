"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Users, LogOut } from "lucide-react";
import { getEventDetail, getMySchedule, getMyTicketType } from "~/api";
import { formatPrice } from "~/utils";

export default function CheckInPage() {
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

  // Calculate check-in statistics
  const totalTicketsSold = ticketTypes.reduce((sum, type) => {
    return sum + (type.originalQuantity - type.remainingQuantity);
  }, 0);

  const totalCheckedIn = 0; // Placeholder - would come from API
  const inEvent = 0; // Placeholder
  const exited = 0; // Placeholder

  const checkInPercentage =
    totalTicketsSold > 0
      ? Math.round((totalCheckedIn / totalTicketsSold) * 100)
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
        <h2 className="text-2xl font-bold mb-4">Check-in</h2>
      </div>

      {/* Overview Section */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Tổng quan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left: Checked-in count */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Đã check-in</p>
            <p className="text-2xl font-bold">{totalCheckedIn} vé</p>
            <p className="text-sm text-muted-foreground mt-1">
              Đã bán {totalTicketsSold} vé
            </p>
          </div>

          {/* Center: Progress circle */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 56 * (1 - checkInPercentage / 100)
                  }`}
                  className="text-yellow-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {checkInPercentage} %
                </span>
              </div>
            </div>
          </div>

          {/* Right: In event and Exited */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trong sự kiện</p>
                <p className="text-xl font-bold">{inEvent}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <LogOut className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã ra ngoài</p>
                <p className="text-xl font-bold">{exited}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Chi tiết</h3>
        <p className="text-sm text-muted-foreground mb-4">Vé đã bán</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Loại vé</th>
                <th className="text-left p-3">Giá bán</th>
                <th className="text-left p-3">Đã check-in</th>
                <th className="text-left p-3">Tỉ lệ check-in</th>
              </tr>
            </thead>
            <tbody>
              {ticketTypes.map((type) => {
                const sold = type.originalQuantity - type.remainingQuantity;
                const checkedIn = 0; // Placeholder - would come from API
                const checkInRatio =
                  sold > 0 ? Math.round((checkedIn / sold) * 100) : 0;
                return (
                  <tr key={type.id} className="border-b">
                    <td className="p-3">{type.name}</td>
                    <td className="p-3">{formatPrice(Number(type.price))}đ</td>
                    <td className="p-3">
                      {checkedIn}/{sold}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500"
                            style={{ width: `${checkInRatio}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{checkInRatio}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {ticketTypes.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
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
