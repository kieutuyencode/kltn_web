"use client";
import { useState, useEffect, useRef } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components";
import { EventCard } from "./components";
import { getMyEvent, getMySchedule, deleteEvent, getEventStatus } from "~/api";
import type { TEvent } from "~/types";
import { formatDate, formatTime, getResourceClientUrl } from "~/utils";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch event statuses from API
  const statusQuery = useQuery({
    queryKey: getEventStatus.queryKey(),
    queryFn: () => getEventStatus(),
  });

  const statusOptions = [
    { value: "all", label: "Tất cả" },
    ...(statusQuery.data?.data?.map((status) => ({
      value: String(status.id),
      label: status.name,
    })) || []),
  ];

  const eventsQuery = useInfiniteQuery({
    queryKey: getMyEvent.queryKey({
      search: debouncedSearchQuery || undefined,
      statusId:
        selectedStatusId && selectedStatusId !== "all"
          ? parseInt(selectedStatusId)
          : undefined,
    }),
    queryFn: ({ pageParam = 1 }) =>
      getMyEvent({
        search: debouncedSearchQuery || undefined,
        statusId:
          selectedStatusId && selectedStatusId !== "all"
            ? parseInt(selectedStatusId)
            : undefined,
        page: pageParam,
        limit: 10,
      }),
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const totalPages = Math.ceil((lastPage.data?.count || 0) / 10);
      const currentPage = lastPageParam as number;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: async (result) => {
      toast.success(result.message || "Xóa sự kiện thành công!");
      // Invalidate event query
      await queryClient.invalidateQueries({
        queryKey: getMyEvent.queryKey({
          search: debouncedSearchQuery || undefined,
          statusId:
            selectedStatusId && selectedStatusId !== "all"
              ? parseInt(selectedStatusId)
              : undefined,
        }),
      });
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    },
  });

  // Flatten all pages into a single array
  const allEvents =
    eventsQuery.data?.pages.flatMap((page) => page.data?.rows || []) || [];

  // Load schedules for events
  const eventsWithSchedules = useQuery({
    queryKey: ["events", "with-schedules", allEvents.map((e) => e.id)],
    queryFn: async () => {
      if (!allEvents.length) return [];
      return Promise.all(
        allEvents.map(async (event) => {
          try {
            const scheduleResponse = await getMySchedule(event.id);
            return {
              ...event,
              schedules:
                scheduleResponse.status && scheduleResponse.data
                  ? scheduleResponse.data
                  : [],
            };
          } catch {
            return { ...event, schedules: [] };
          }
        })
      );
    },
    enabled: allEvents.length > 0,
  });

  const events: TEvent[] = eventsWithSchedules.data || [];
  const isLoading = eventsQuery.isLoading || eventsWithSchedules.isLoading;
  const isFetchingNextPage = eventsQuery.isFetchingNextPage;
  const hasNextPage = eventsQuery.hasNextPage;

  // Infinite scroll: observe when loadMoreRef is visible
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          eventsQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, eventsQuery]);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "/logo.png";
    if (imagePath.startsWith("http")) return imagePath;
    return getResourceClientUrl(imagePath);
  };

  return (
    <>
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Tìm kiếm sự kiện"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10" // shadcn Input mặc định có chiều cao h-10
            />
          </div>

          <Select
            value={selectedStatusId}
            onValueChange={(value) => {
              setSelectedStatusId(value);
              // Reset query when status changes - queryKey change will auto-reset, but we ensure it
              queryClient.resetQueries({
                queryKey: getMyEvent.queryKey(),
              });
            }}
          >
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Đang tải...</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {events.length > 0 ? (
              <>
                {events.map((event) => {
                  // Get first schedule if available
                  const firstSchedule = event.schedules?.[0];
                  const date = firstSchedule
                    ? formatDate(firstSchedule.startDate)
                    : "Chưa có lịch";
                  const time = firstSchedule
                    ? formatTime(firstSchedule.startDate)
                    : "";

                  // Get first schedule for navigation
                  const firstScheduleId = event.schedules?.[0]?.id;

                  return (
                    <EventCard
                      key={event.id}
                      image={getImageUrl(event.image)}
                      title={event.name}
                      date={date}
                      time={time}
                      location={event.category?.name || "Chưa phân loại"}
                      address={event.address}
                      onManage={() => {
                        // Điều hướng đến trang quản trị sự kiện chính (summary) với sidebar riêng
                        const queryParams = new URLSearchParams();
                        if (firstScheduleId) {
                          queryParams.set(
                            "scheduleId",
                            String(firstScheduleId)
                          );
                        }
                        const query = queryParams.toString();
                        router.push(
                          `/manage-events/${event.id}/summary${
                            query ? `?${query}` : ""
                          }`
                        );
                      }}
                      onSummary={() => {
                        // Điều hướng đến trang tổng kết
                        const queryParams = new URLSearchParams();
                        if (firstScheduleId) {
                          queryParams.set(
                            "scheduleId",
                            String(firstScheduleId)
                          );
                        }
                        const query = queryParams.toString();
                        router.push(
                          `/manage-events/${event.id}/summary${
                            query ? `?${query}` : ""
                          }`
                        );
                      }}
                      onOrders={() => {
                        // Điều hướng đến trang danh sách đơn hàng
                        const queryParams = new URLSearchParams();
                        if (firstScheduleId) {
                          queryParams.set(
                            "scheduleId",
                            String(firstScheduleId)
                          );
                        }
                        const query = queryParams.toString();
                        router.push(
                          `/manage-events/${event.id}/orders${
                            query ? `?${query}` : ""
                          }`
                        );
                      }}
                      onCheckIn={() => {
                        // Điều hướng đến trang check-in
                        const queryParams = new URLSearchParams();
                        if (firstScheduleId) {
                          queryParams.set(
                            "scheduleId",
                            String(firstScheduleId)
                          );
                        }
                        const query = queryParams.toString();
                        router.push(
                          `/manage-events/${event.id}/check-in${
                            query ? `?${query}` : ""
                          }`
                        );
                      }}
                      onPaymentHistory={() => {
                        // Điều hướng đến trang lịch sử thanh toán
                        const queryParams = new URLSearchParams();
                        if (firstScheduleId) {
                          queryParams.set(
                            "scheduleId",
                            String(firstScheduleId)
                          );
                        }
                        const query = queryParams.toString();
                        router.push(
                          `/manage-events/${event.id}/payment-history${
                            query ? `?${query}` : ""
                          }`
                        );
                      }}
                      onEdit={() =>
                        router.push(`/organizer/create-event?edit=${event.id}`)
                      }
                      onDelete={() => {
                        setEventToDelete(event.id);
                        setDeleteDialogOpen(true);
                      }}
                    />
                  );
                })}
                <div ref={loadMoreRef} className="py-8 text-center">
                  {isFetchingNextPage && (
                    <p className="text-gray-500 text-lg">Đang tải thêm...</p>
                  )}
                  {!hasNextPage && events.length > 0 && (
                    <p className="text-gray-500 text-sm">
                      Đã hiển thị tất cả sự kiện
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Không tìm thấy sự kiện</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sự kiện</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sự kiện này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setEventToDelete(null);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (eventToDelete) {
                  deleteEventMutation.mutate(eventToDelete);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
