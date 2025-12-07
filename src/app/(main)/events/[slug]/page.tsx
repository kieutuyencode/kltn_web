"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
} from "~/components";
import { ShowtimeSection } from "./components/showtime-section";
import {
  formatPrice,
  getResourceClientUrl,
  getResourceClientUrlWithDefaultAvatar,
} from "~/utils";
import { EventCard, EventGrid } from "~/components";
import { getPublicEventDetail, getPublicEvent } from "~/api";
import type {
  TEventWithDetails,
  TEventSchedule,
  TEventTicketType,
} from "~/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const { slug } = use(params);

  const eventDetailQuery = useQuery({
    queryKey: getPublicEventDetail.queryKey(slug),
    queryFn: () => getPublicEventDetail(slug),
    enabled: !!slug,
  });

  // Get related events
  const relatedEventsQuery = useQuery({
    queryKey: getPublicEvent.queryKey({ limit: 4, page: 1 }),
    queryFn: () => getPublicEvent({ limit: 4, page: 1 }),
  });

  const event = eventDetailQuery.data?.data;
  const eventId = event?.id;
  const relatedEvents: TEventWithDetails[] =
    relatedEventsQuery.data?.data?.rows?.filter((e) => e.id !== eventId) || [];

  if (eventDetailQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-500 text-lg">Đang tải...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-gray-500 text-lg">Không tìm thấy sự kiện</p>
      </div>
    );
  }

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Get first schedule for display
  const firstSchedule = event.schedules?.[0];
  const fullDate = firstSchedule
    ? `${formatTime(firstSchedule.startDate)} - ${formatTime(
        firstSchedule.endDate
      )} | ${formatDateTime(firstSchedule.startDate)}`
    : "Chưa có lịch";

  // Calculate min price from all ticket types
  const allTicketTypes =
    event.schedules?.flatMap((schedule) => {
      const scheduleWithTickets = schedule as TEventSchedule & {
        ticketTypes?: TEventTicketType[];
      };
      return scheduleWithTickets.ticketTypes || [];
    }) || [];
  const minPrice =
    allTicketTypes.length > 0
      ? Math.min(...allTicketTypes.map((ticket) => parseFloat(ticket.price)))
      : 800000;

  // Transform schedules to showtimes format
  const showtimes =
    event.schedules?.map((schedule) => {
      const scheduleWithTickets = schedule as TEventSchedule & {
        ticketTypes?: TEventTicketType[];
      };
      return {
        id: String(schedule.id),
        scheduleId: schedule.id,
        time: `${formatTime(schedule.startDate)} - ${formatTime(
          schedule.endDate
        )}`,
        date: formatDateTime(schedule.startDate),
        tickets:
          scheduleWithTickets.ticketTypes?.map((ticket: TEventTicketType) => ({
            id: ticket.id,
            name: ticket.name,
            price: parseFloat(ticket.price),
            soldOut: ticket.remainingQuantity === 0,
            remainingQuantity: ticket.remainingQuantity,
          })) || [],
      };
    }) || [];

  return (
    <div className="min-h-screen bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Hero Section */}
        <div className="pt-8 pb-12">
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Panel - Event Information */}
                <div className="flex flex-col gap-6 order-2 lg:order-1">
                  <div className="flex flex-col gap-4">
                    {event.category && (
                      <Badge
                        variant="outline"
                        className="w-fit text-sm px-3 py-1"
                      >
                        {event.category.name}
                      </Badge>
                    )}
                    <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight">
                      {event.name}
                    </h1>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-base text-foreground font-medium">
                        {fullDate}
                      </span>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-base text-foreground font-medium">
                        {event.address}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 px-3">
                      <span className="text-3xl font-bold text-primary">
                        Từ {formatPrice(minPrice)} EVT
                      </span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full lg:w-fit bg-primary hover:bg-primary/90 text-base px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all"
                    onClick={() => {
                      const showtimeSection =
                        document.getElementById("showtime-section");
                      if (showtimeSection) {
                        showtimeSection.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }}
                  >
                    Mua vé ngay
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>

                {/* Right Panel - Event Image */}
                <div className="relative w-full aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-2 border-border/50 order-1 lg:order-2 group">
                  <Image
                    src={getImageUrl(event.image)}
                    alt={event.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Description */}
        <div className="mb-12">
          <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground">
                Giới thiệu sự kiện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.description || "Không có mô tả"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Information - Showtimes */}
        {showtimes.length > 0 && (
          <div id="showtime-section" className="mb-12">
            <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-foreground text-lg font-bold">
                  Thông tin vé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ShowtimeSection showtimes={showtimes} slug={slug} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Organizer Information */}
        {event.user && (
          <div className="mb-12">
            <Card className="bg-card border-border shadow-lg">
              <CardContent>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ban tổ chức
                </h2>
                <Separator className="mb-6" />
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex flex-col items-center md:items-start gap-3 shrink-0">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted shadow-md">
                      <Image
                        src={getResourceClientUrlWithDefaultAvatar(
                          event.user.avatar
                        )}
                        alt={event.user.fullName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <h3 className="text-xl font-bold text-foreground uppercase mb-4">
                      {event.user.fullName}
                    </h3>
                    {event.user.description && (
                      <div className="space-y-3 text-base text-muted-foreground leading-relaxed">
                        {event.user.description
                          .split("\n")
                          .map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Các sự kiện đang diễn ra
              </h2>
              <Button variant="outline" asChild>
                <Link href="/">
                  Xem tất cả
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
            <EventGrid>
              {relatedEvents.slice(0, 4).map((relatedEvent) => {
                const schedule = relatedEvent.schedule;
                const date = schedule
                  ? formatDate(schedule.startDate)
                  : "Chưa có lịch";
                const minPrice = relatedEvent.ticketType
                  ? parseFloat(relatedEvent.ticketType.price)
                  : 500000;

                return (
                  <EventCard
                    key={relatedEvent.id}
                    event={{
                      id: String(relatedEvent.id),
                      slug: relatedEvent.slug,
                      image: getImageUrl(relatedEvent.image),
                      category: relatedEvent.category?.name || "Chưa phân loại",
                      date: date,
                      title: relatedEvent.name,
                      location: relatedEvent.address,
                      minPrice: minPrice,
                    }}
                  />
                );
              })}
            </EventGrid>
          </div>
        )}
      </div>
    </div>
  );
}
