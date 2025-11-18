"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components";
import { EventCard } from "./components";
import { getMyEvent, getMySchedule, deleteEvent } from "~/api";
import type { TEvent } from "~/types";
import { getResourceClientUrl } from "~/utils";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const statusOptions = [
    { value: "all", label: "Tất cả" },
    { value: "1", label: "Nháp" },
    { value: "2", label: "Hoạt động" },
    { value: "3", label: "Không hoạt động" },
  ];

  const eventsQuery = useQuery({
    queryKey: getMyEvent.queryKey({
      search: searchQuery || undefined,
      statusId:
        selectedStatusId && selectedStatusId !== "all"
          ? parseInt(selectedStatusId)
          : undefined,
      page: currentPage,
      limit: 10,
    }),
    queryFn: () =>
      getMyEvent({
        search: searchQuery || undefined,
        statusId:
          selectedStatusId && selectedStatusId !== "all"
            ? parseInt(selectedStatusId)
            : undefined,
        page: currentPage,
        limit: 10,
      }),
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: (result) => {
      toast.success(result.message || "Xóa sự kiện thành công!");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Load schedules for events
  const eventsWithSchedules = useQuery({
    queryKey: [
      "events",
      "with-schedules",
      eventsQuery.data?.data?.rows?.map((e) => e.id) || [],
    ],
    queryFn: async () => {
      if (!eventsQuery.data?.data?.rows) return [];
      return Promise.all(
        eventsQuery.data.data.rows.map(async (event) => {
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
    enabled: !!eventsQuery.data?.data?.rows,
  });

  const events: TEvent[] = eventsWithSchedules.data || [];
  const totalPages = eventsQuery.data?.data
    ? Math.ceil(eventsQuery.data.data.count / 10)
    : 1;
  const isLoading = eventsQuery.isLoading || eventsWithSchedules.isLoading;

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "/logo.png";
    if (imagePath.startsWith("http")) return imagePath;
    return getResourceClientUrl(imagePath);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

          <Button
            variant="outline"
            onClick={() => {
              setCurrentPage(1);
            }}
          >
            Tìm kiếm
          </Button>

          <Select
            value={selectedStatusId}
            onValueChange={(value) => {
              setSelectedStatusId(value);
              setCurrentPage(1);
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

          <Button onClick={() => router.push("/organizer/create-event")}>
            Tạo sự kiện
          </Button>
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
              events.map((event) => {
                // Get first schedule if available
                const firstSchedule = event.schedules?.[0];
                const date = firstSchedule
                  ? formatDate(firstSchedule.startDate)
                  : "Chưa có lịch";
                const time = firstSchedule
                  ? formatTime(firstSchedule.startDate)
                  : "";

                return (
                  <EventCard
                    key={event.id}
                    image={getImageUrl(event.image)}
                    title={event.name}
                    date={date}
                    time={time}
                    location={event.category?.name || "Chưa phân loại"}
                    address={event.address}
                    onStats={() => console.log("Stats", event.id)}
                    onMembers={() => console.log("Members", event.id)}
                    onOrders={() => console.log("Orders", event.id)}
                    onGhost={() => console.log("Ghost", event.id)}
                    onEdit={() =>
                      router.push(`/organizer/create-event?edit=${event.id}`)
                    }
                    onDelete={() => {
                      if (
                        confirm(
                          "Bạn có chắc chắn muốn xóa sự kiện này? Hành động này không thể hoàn tác."
                        )
                      ) {
                        deleteEventMutation.mutate(event.id);
                      }
                    }}
                  />
                );
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Không tìm thấy sự kiện</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="icon">
                {currentPage}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
