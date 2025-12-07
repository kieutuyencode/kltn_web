"use client";

import { Calendar, RefreshCw, Plus, User, Star } from "lucide-react";
import {
  useRouter,
  useSearchParams,
  useParams,
  usePathname,
} from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getEventDetail, getMySchedule } from "~/api";
import { Button } from "~/components";
import { formatDate, formatTime } from "~/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useState, useEffect } from "react";

export function EventHeader() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const eventId = (params?.id as string) || searchParams.get("eventId");
  const scheduleId = searchParams.get("scheduleId");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

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

  // Tự động chọn suất diễn: ưu tiên suất diễn trong quá khứ gần nhất
  useEffect(() => {
    // Chỉ chạy khi đã load xong schedules và chưa có scheduleId
    if (
      !scheduleId &&
      schedules.length > 0 &&
      !schedulesQuery.isLoading &&
      schedulesQuery.isSuccess
    ) {
      const now = new Date();

      // Tìm các suất diễn trong quá khứ (đã qua)
      const pastSchedules = schedules.filter(
        (s) => new Date(s.startDate) < now
      );

      let nearestSchedule;
      if (pastSchedules.length > 0) {
        // Chọn suất diễn trong quá khứ gần nhất với thời gian hiện tại
        nearestSchedule = pastSchedules.reduce((nearest, current) => {
          const nearestDate = new Date(nearest.startDate);
          const currentDate = new Date(current.startDate);
          const nowTime = now.getTime();
          const nearestDiff = Math.abs(nearestDate.getTime() - nowTime);
          const currentDiff = Math.abs(currentDate.getTime() - nowTime);
          // Chọn suất diễn có khoảng cách nhỏ nhất (gần nhất)
          return currentDiff < nearestDiff ? current : nearest;
        });
      } else {
        // Nếu không có suất diễn trong quá khứ, chọn suất diễn gần nhất trong tương lai
        const futureSchedules = schedules.filter(
          (s) => new Date(s.startDate) >= now
        );
        if (futureSchedules.length > 0) {
          nearestSchedule = futureSchedules.reduce((nearest, current) => {
            const nearestDate = new Date(nearest.startDate);
            const currentDate = new Date(current.startDate);
            return currentDate < nearestDate ? current : nearest;
          });
        } else {
          // Nếu không có suất diễn nào, chọn suất diễn đầu tiên
          nearestSchedule = schedules[0];
        }
      }

      if (nearestSchedule) {
        const queryParams = new URLSearchParams();
        queryParams.set("scheduleId", String(nearestSchedule.id));
        router.replace(`${pathname}?${queryParams.toString()}`);
      }
    }
  }, [
    scheduleId,
    schedules,
    pathname,
    router,
    schedulesQuery.isLoading,
    schedulesQuery.isSuccess,
  ]);

  const handleScheduleChange = (newScheduleId: number) => {
    const queryParams = new URLSearchParams();
    queryParams.set("scheduleId", String(newScheduleId));
    // Get current pathname to maintain the current page
    router.push(`${pathname}?${queryParams.toString()}`);
    setScheduleDialogOpen(false);
    setSelectedMonthKey(null); // Reset selected month
  };

  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatScheduleTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group schedules by month
  const schedulesByMonth = schedules.reduce((acc, schedule) => {
    const date = new Date(schedule.startDate);
    const monthKey = `${date.getMonth() + 1}-${date.getFullYear()}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(schedule);
    return acc;
  }, {} as Record<string, typeof schedules>);

  // Xác định tháng được chọn mặc định
  const getDefaultSelectedMonth = () => {
    if (selectedMonthKey) return selectedMonthKey;
    if (selectedSchedule) {
      const date = new Date(selectedSchedule.startDate);
      return `${date.getMonth() + 1}-${date.getFullYear()}`;
    }
    const sortedKeys = Object.keys(schedulesByMonth).sort();
    return sortedKeys[0] || null;
  };

  const currentSelectedMonth = getDefaultSelectedMonth();
  const currentMonthSchedules = currentSelectedMonth
    ? schedulesByMonth[currentSelectedMonth] || []
    : [];

  if (!eventId || !event) {
    return (
      <div className="mb-6">
        <p className="text-muted-foreground">
          Vui lòng chọn sự kiện từ trang quản lý sự kiện
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        {/* Header với tên sự kiện và các nút action */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{event.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push("/organizer/create-event")}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo sự kiện
            </Button>
            <Button variant="outline">
              <User className="w-4 h-4 mr-2" />
              Tài khoản
            </Button>
          </div>
        </div>

        {/* Dòng hiển thị ngày giờ và nút đổi suất diễn */}
        {schedules.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedSchedule ? (
                <>
                  <div className="relative">
                    <Calendar className="w-5 h-5" />
                    <Star className="w-3 h-3 absolute -top-0.5 -right-0.5 fill-current" />
                  </div>
                  <span>
                    {formatScheduleDate(selectedSchedule.startDate)} -{" "}
                    {formatScheduleTime(selectedSchedule.startDate)}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  Chưa chọn suất diễn
                </span>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedMonthKey(null); // Reset khi mở dialog
                setScheduleDialogOpen(true);
              }}
              className="text-primary border-primary hover:bg-primary/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Đổi suất diễn
            </Button>
          </div>
        )}
      </div>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Danh sách suất diễn</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Cột trái: Danh sách tháng */}
              <div className="space-y-2">
                {Object.keys(schedulesByMonth)
                  .sort()
                  .map((monthKey) => {
                    const [month, year] = monthKey.split("-");
                    const isCurrentSelected = monthKey === currentSelectedMonth;

                    return (
                      <button
                        key={monthKey}
                        onClick={() => setSelectedMonthKey(monthKey)}
                        className={`w-full text-left p-3 rounded-lg font-semibold transition-colors ${
                          isCurrentSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        Th {month}-{year}
                      </button>
                    );
                  })}
              </div>

              {/* Cột phải: Danh sách suất diễn của tháng được chọn */}
              <div className="space-y-2">
                {currentMonthSchedules.length > 0 ? (
                  currentMonthSchedules.map((schedule) => (
                    <button
                      key={schedule.id}
                      onClick={() => handleScheduleChange(schedule.id)}
                      className={`w-full text-left p-2 rounded hover:bg-gray-100 flex items-center justify-between ${
                        schedule.id === Number(scheduleId)
                          ? "bg-primary/10 border border-primary/30"
                          : ""
                      }`}
                    >
                      <span>
                        {formatScheduleDate(schedule.startDate)} -{" "}
                        {formatScheduleTime(schedule.startDate)}
                      </span>
                      {schedule.id === Number(scheduleId) && (
                        <span className="text-primary font-bold">✓</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    Không có suất diễn
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => setScheduleDialogOpen(false)}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Xác nhận
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
