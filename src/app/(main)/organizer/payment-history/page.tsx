"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyEvent, getMySchedule } from "~/api";
import { formatPrice, formatDate, formatTime } from "~/utils";
import { Button, Card, CardContent, CardHeader, CardTitle } from "~/components";
import { History } from "lucide-react";
import { useAuthStore } from "~/stores";
import Link from "next/link";

const formatDateTime = (dateString: string) => {
  return `${formatTime(dateString)}, ${formatDate(dateString)}`;
};

export default function PaymentHistoryPage() {
  const authStore = useAuthStore();
  const isAuthenticated = !!authStore.userAccessToken;

  const eventsQuery = useQuery({
    queryKey: getMyEvent.queryKey({}),
    queryFn: () => getMyEvent({}),
    enabled: isAuthenticated,
  });

  const events = eventsQuery.data?.data?.rows || [];

  // Load schedules for all events
  const schedulesQuery = useQuery({
    queryKey: ["all-schedules", events.map((e) => e.id)],
    queryFn: async () => {
      if (!events.length) return [];
      return Promise.all(
        events.map(async (event) => {
          try {
            const scheduleResponse = await getMySchedule(event.id);
            return {
              event,
              schedules:
                scheduleResponse.status && scheduleResponse.data
                  ? scheduleResponse.data
                  : [],
            };
          } catch {
            return { event, schedules: [] };
          }
        })
      );
    },
    enabled: events.length > 0,
  });

  const eventsWithSchedules = schedulesQuery.data || [];

  // Note: This would need an API endpoint to get payment organizer history
  // For now, showing placeholder structure
  const allPayments: any[] = []; // Placeholder

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vui lòng đăng nhập</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Lịch sử thanh toán</h1>
        <p className="text-muted-foreground">
          Xem lịch sử thanh toán cho tất cả suất diễn của bạn
        </p>
      </div>

      {eventsQuery.isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      ) : eventsWithSchedules.length > 0 ? (
        <div className="space-y-4">
          {eventsWithSchedules.map(({ event, schedules }) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{event.name}</span>
                  <Link
                    href={`/organizer/payment-history?eventId=${event.id}`}
                    className="text-sm text-green-600 hover:underline"
                  >
                    Xem chi tiết
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {schedules.map((schedule) => {
                    // Filter payments for this schedule
                    const schedulePayments = allPayments.filter(
                      (p) => p.scheduleId === schedule.id
                    );
                    const totalAmount = schedulePayments.reduce(
                      (sum, p) => sum + Number(p.receiveAmount || 0),
                      0
                    );

                    return (
                      <div
                        key={schedule.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold">
                            {formatDateTime(schedule.startDate)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.organizerAddress}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              {formatPrice(totalAmount)}đ
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {schedulePayments.length} thanh toán
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.location.href = `/organizer/payment-history?eventId=${event.id}&scheduleId=${schedule.id}`;
                            }}
                          >
                            Chi tiết
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {schedules.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Chưa có suất diễn nào
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <History className="w-12 h-12 mx-auto mb-2 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">Chưa có sự kiện nào</p>
        </div>
      )}

      {allPayments.length === 0 && eventsWithSchedules.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Chưa có lịch sử thanh toán</p>
        </div>
      )}
    </div>
  );
}

