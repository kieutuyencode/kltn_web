"use client";

import { useState, useEffect, useRef } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Search } from "lucide-react";
import {
  EventCard,
  EventGrid,
  ScrollArea,
  ScrollBar,
  Tabs,
  TabsList,
  TabsTrigger,
  Input,
} from "~/components";
import { getPublicEvent, getEventCategory } from "~/api";
import { getResourceClientUrl } from "~/utils";
import type { TEventWithDetails } from "~/types";

export default function Page() {
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch event categories from API
  const categoryQuery = useQuery({
    queryKey: getEventCategory.queryKey(),
    queryFn: () => getEventCategory(),
  });

  const categories = categoryQuery.data?.data || [];
  const categoryOptions = [
    { id: 0, name: "Tất cả", slug: "all" },
    ...categories,
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");

  // Map category name to categoryId
  const categoryId =
    selectedCategory === "Tất cả"
      ? undefined
      : categories.find((cat) => cat.name === selectedCategory)?.id;

  const eventsQuery = useInfiniteQuery({
    queryKey: getPublicEvent.queryKey({
      categoryId: categoryId,
      search: debouncedSearchQuery || undefined,
    }),
    queryFn: ({ pageParam = 1 }) =>
      getPublicEvent({
        categoryId: categoryId,
        search: debouncedSearchQuery || undefined,
        page: pageParam,
        limit: 12,
      }),
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const totalPages = Math.ceil((lastPage.data?.count || 0) / 12);
      const currentPage = lastPageParam as number;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten all pages into a single array
  const events: TEventWithDetails[] =
    eventsQuery.data?.pages.flatMap((page) => page.data?.rows || []) || [];
  const isLoading = eventsQuery.isLoading || categoryQuery.isLoading;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "/logo.png";
    if (imagePath.startsWith("http")) return imagePath;
    return getResourceClientUrl(imagePath);
  };

  const getMinPrice = (event: TEventWithDetails) => {
    return parseFloat(event.ticketType!.price);
  };

  return (
    <>
      {/* <EventCarousel /> */}

      <h2 className="text-2xl font-semibold">Sự kiện</h2>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Tìm kiếm sự kiện"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>

      <ScrollArea>
        <Tabs
          value={selectedCategory}
          onValueChange={(value) => {
            setSelectedCategory(value);
            // Reset query when category changes - queryKey change will auto-reset, but we ensure it
            queryClient.resetQueries({
              queryKey: getPublicEvent.queryKey(),
            });
          }}
        >
          <TabsList>
            {categoryOptions.map((item) => (
              <TabsTrigger key={item.name} value={item.name}>
                {item.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Đang tải...</p>
        </div>
      ) : events.length > 0 ? (
        <>
          <EventGrid>
            {events.map((event) => {
              const schedule = event.schedule;
              const date = schedule
                ? formatDate(schedule.startDate)
                : "Chưa có lịch";
              const minPrice = getMinPrice(event);

              return (
                <EventCard
                  key={event.id}
                  event={{
                    id: String(event.id),
                    slug: event.slug,
                    image: getImageUrl(event.image),
                    category: event.category?.name || "Chưa phân loại",
                    date: date,
                    title: event.name,
                    location: event.address,
                    minPrice: minPrice,
                  }}
                />
              );
            })}
          </EventGrid>
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
    </>
  );
}
