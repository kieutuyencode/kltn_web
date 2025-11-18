"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  EventCard,
  EventGrid,
  ScrollArea,
  ScrollBar,
  Tabs,
  TabsList,
  TabsTrigger,
} from "~/components";
import { EventCategory } from "~/data";
import { EventCarousel } from "~/app/(main)/components";
import { getPublicEvent } from "~/api";
import { getResourceClientUrl } from "~/utils";
import type { TEventWithDetails } from "~/types";

export default function Page() {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    EventCategory[0].name
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Map category name to categoryId
  // Filter out "Tất cả" first, then use index + 1 to match backend EventCategoryId
  const categoryId =
    selectedCategory === "Tất cả"
      ? undefined
      : EventCategory.filter((cat) => cat.name !== "Tất cả").findIndex(
          (cat) => cat.name === selectedCategory
        ) + 1;

  const eventsQuery = useQuery({
    queryKey: getPublicEvent.queryKey({
      categoryId: categoryId,
      page: currentPage,
      limit: 12,
    }),
    queryFn: () =>
      getPublicEvent({
        categoryId: categoryId,
        page: currentPage,
        limit: 12,
      }),
  });

  const events: TEventWithDetails[] = eventsQuery.data?.data?.rows || [];
  const isLoading = eventsQuery.isLoading;

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

      <ScrollArea>
        <Tabs
          value={selectedCategory}
          onValueChange={(value) => {
            setSelectedCategory(value);
            setCurrentPage(1);
          }}
        >
          <TabsList>
            {EventCategory.map((item) => (
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
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Không tìm thấy sự kiện</p>
        </div>
      )}
    </>
  );
}
