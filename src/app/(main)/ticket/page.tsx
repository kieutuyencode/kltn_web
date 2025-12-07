"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
} from "~/components";
import { getMyTicket } from "~/api";
import { getResourceClientUrl, formatPrice } from "~/utils";
import type { TUserTicket } from "~/types";
import { useAuthStore } from "~/stores";

const filterSchema = z.object({
  isRedeemed: z.enum(["all", "1", "0"]).optional(),
});

type FilterFormDto = z.infer<typeof filterSchema>;

export default function TicketPage() {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();
  const isAuthenticated = !!authStore.userAccessToken;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const form = useForm<FilterFormDto>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      isRedeemed: "all",
    },
  });

  const watchedValues = form.watch();
  const isRedeemed =
    watchedValues.isRedeemed === "all" ? undefined : watchedValues.isRedeemed;

  const ticketsQuery = useInfiniteQuery({
    queryKey: getMyTicket.queryKey({
      isRedeemed,
    }),
    queryFn: ({ pageParam = 1 }) =>
      getMyTicket({
        isRedeemed,
        page: pageParam,
        limit: 10,
      }),
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const totalPages = Math.ceil((lastPage.data?.count || 0) / 10);
      const currentPage = lastPageParam as number;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: isAuthenticated,
  });

  // Flatten all pages into a single array
  const tickets: TUserTicket[] =
    ticketsQuery.data?.pages.flatMap((page) => page.data?.rows || []) || [];
  const isLoading = ticketsQuery.isLoading;
  const isFetchingNextPage = ticketsQuery.isFetchingNextPage;
  const hasNextPage = ticketsQuery.hasNextPage;

  // Infinite scroll: observe when loadMoreRef is visible
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          ticketsQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, ticketsQuery]);

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

  const formatDateTime = (dateString: string) => {
    const date = formatDate(dateString);
    const time = formatTime(dateString);
    return `${time}, ${date}`;
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return "/logo.png";
    if (imagePath.startsWith("http")) return imagePath;
    return getResourceClientUrl(imagePath);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          Vui lòng đăng nhập để xem vé của bạn
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filter Section */}
      <div className="flex">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(() => {
              // Reset query when filter changes - queryKey change will auto-reset, but we ensure it
              queryClient.resetQueries({
                queryKey: getMyTicket.queryKey(),
              });
            })();
          }}
        >
          <Controller
            name="isRedeemed"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  // Reset query when filter changes - queryKey change will auto-reset, but we ensure it
                  queryClient.resetQueries({
                    queryKey: getMyTicket.queryKey(),
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="0">Chưa sử dụng</SelectItem>
                  <SelectItem value="1">Đã sử dụng</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </form>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Đang tải...</p>
        </div>
      ) : tickets.length > 0 ? (
        <>
          <div className="space-y-4 mb-8">
            {tickets.map((ticket) => {
              const event = ticket.event;
              const schedule = ticket.schedule;
              const ticketType = ticket.ticketType;

              if (!event || !schedule || !ticketType) {
                return null;
              }

              const endDate = new Date(schedule.endDate);
              const isPast = endDate < new Date();

              return (
                <Card
                  key={ticket.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow p-0"
                >
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                      {/* Event Image */}
                      <div className="relative w-full h-64 lg:h-full lg:min-h-[280px] bg-muted overflow-hidden">
                        <Image
                          src={getImageUrl(event.image)}
                          alt={event.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Ticket Info */}
                      <div className="lg:col-span-2 p-6 flex flex-col gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <Link
                                  href={`/events/${event.slug}`}
                                  className="hover:underline flex-1"
                                >
                                  <h3 className="text-xl font-bold text-foreground">
                                    {event.name}
                                  </h3>
                                </Link>
                                <Badge
                                  variant={
                                    ticket.isRedeemed
                                      ? "default"
                                      : isPast
                                      ? "destructive"
                                      : "default"
                                  }
                                  className={`flex items-center gap-1.5 shrink-0 ${
                                    ticket.isRedeemed
                                      ? "bg-green-600 hover:bg-green-700"
                                      : isPast
                                      ? "bg-red-600 hover:bg-red-700"
                                      : "bg-blue-600 hover:bg-blue-700"
                                  } text-white border-0 shadow-md`}
                                >
                                  {ticket.isRedeemed ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Đã sử dụng
                                    </>
                                  ) : isPast ? (
                                    <>
                                      <XCircle className="w-3.5 h-3.5" />
                                      Đã hết hạn
                                    </>
                                  ) : (
                                    <>
                                      <Ticket className="w-3.5 h-3.5" />
                                      Chưa sử dụng
                                    </>
                                  )}
                                </Badge>
                              </div>
                              {event.category && (
                                <Badge variant="outline" className="mb-2">
                                  {event.category.name}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Separator className="my-4" />

                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Ticket className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                  Loại vé
                                </p>
                                <p className="font-medium text-foreground">
                                  {ticketType.name}
                                </p>
                                {ticketType.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {ticketType.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                  Ngày diễn ra
                                </p>
                                <p className="font-medium text-foreground">
                                  {formatDate(schedule.startDate)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                  Thời gian
                                </p>
                                <p className="font-medium text-foreground">
                                  {formatTime(schedule.startDate)} -{" "}
                                  {formatTime(schedule.endDate)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                  Địa điểm
                                </p>
                                <p className="font-medium text-foreground">
                                  {event.address}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            {/* <p className="text-sm text-muted-foreground">
                              Giá vé
                            </p>
                            <p className="text-lg font-bold text-primary">
                              {formatPrice(parseFloat(ticketType.price))} EVT
                            </p> */}

                            <Link href={`/ticket/${ticket.id}`}>
                              <Button variant="outline" size="sm">
                                Xem chi tiết
                              </Button>
                            </Link>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Mua lúc
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {formatDateTime(ticket.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="py-8 text-center">
            {isFetchingNextPage && (
              <p className="text-muted-foreground text-lg">Đang tải thêm...</p>
            )}
            {!hasNextPage && tickets.length > 0 && (
              <p className="text-muted-foreground text-sm">
                Đã hiển thị tất cả vé
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            Chưa có vé nào
          </p>
        </div>
      )}
    </>
  );
}
