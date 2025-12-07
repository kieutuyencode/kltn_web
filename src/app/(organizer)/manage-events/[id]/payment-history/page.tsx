"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getEventDetail, getMySchedule } from "~/api";
import { formatPrice, formatDate, formatTime } from "~/utils";
import { Button } from "~/components";
import { History } from "lucide-react";

const formatDateTime = (dateString: string) => {
  return `${formatTime(dateString)}, ${formatDate(dateString)}`;
};

export default function PaymentHistoryPage() {
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

  const event = eventQuery.data?.data;
  const schedules = schedulesQuery.data?.data || [];
  const selectedSchedule = schedules.find((s) => s.id === Number(scheduleId));

  // Note: This would need an API endpoint to get payment organizer history
  const payments: any[] = []; // Placeholder

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
        <h2 className="text-2xl font-bold mb-4">Lịch sử thanh toán</h2>
        <p className="text-muted-foreground">
          Yêu cầu thanh toán tiền bán vé sau khi suất diễn kết thúc
        </p>
      </div>

      {selectedSchedule && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Suất diễn</h3>
              <p className="text-muted-foreground">
                {formatDateTime(selectedSchedule.startDate)}
              </p>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              Yêu cầu thanh toán
            </Button>
          </div>

          {payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {formatPrice(Number(payment.receiveAmount))}đ
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(payment.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded text-sm">
                      {payment.status?.name || "Đã thanh toán"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có lịch sử thanh toán</p>
            </div>
          )}
        </div>
      )}

      {!selectedSchedule && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vui lòng chọn suất diễn</p>
        </div>
      )}
    </div>
  );
}
