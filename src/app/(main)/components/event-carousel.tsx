"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  MapPin,
  LucideIcon,
} from "lucide-react";
import { Badge, Button } from "~/components";
import { getPublicEvent } from "~/api";
import { getResourceClientUrl, formatDateOnly } from "~/utils";
import type { TEventWithDetails } from "~/types";

interface CarouselEvent {
  id: string;
  image: string;
  title: string;
  category: string;
  date: string;
  location: string;
  minPrice: number;
  slug: string;
}

function mapToCarouselEvents(events: TEventWithDetails[]): CarouselEvent[] {
  return events.slice(0, 4).map((event) => ({
    id: String(event.id),
    slug: event.slug,
    image: getResourceClientUrl(event.image),
    title: event.name,
    category: event.category?.name ?? "",
    date: event.schedules?.[0]?.startDate
      ? formatDateOnly(event.schedules[0].startDate)
      : "",
    location: event.address ?? "",
    minPrice: event.ticketType?.price
      ? Number(event.ticketType.price)
      : 0,
  }));
}

export const EventCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isPending } = useQuery({
    queryKey: getPublicEvent.queryKey({ limit: 4 }),
    queryFn: () => getPublicEvent({ limit: 4 }),
  });

  const carouselEvents = useMemo(() => {
    const rows = data?.data?.rows ?? [];
    return mapToCarouselEvents(rows);
  }, [data]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? carouselEvents.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === carouselEvents.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  if (isPending || carouselEvents.length === 0) {
    return null;
  }

  const safeIndex = Math.min(currentIndex, carouselEvents.length - 1);
  const currentEvent = carouselEvents[safeIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-lg mb-12">
      <div
        className="absolute inset-0 bg-cover bg-center blur-xl"
        style={{
          backgroundImage: `url(${currentEvent.image})`,
        }}
      ></div>

      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative z-10">
        {/* Main carousel content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 p-8 lg:p-12 ">
          {/* Left side - Image and button */}
          <div className="flex flex-col items-center justify-start gap-4 lg:col-span-2">
            <div className="relative w-full h-60 rounded-xl overflow-hidden">
              <Image
                src={currentEvent.image}
                alt={currentEvent.title}
                fill
                className="object-cover"
              />
            </div>
            <Button size="lg" className="w-full" asChild>
              <Link href={`/events/${currentEvent.slug}`}>Xem chi tiết</Link>
            </Button>
          </div>

          {/* Right side - Event details */}
          <div className="flex flex-col justify-center flex-1 text-white lg:col-span-3 gap-5">
            {/* Category badge */}
            <Badge variant="secondary">{currentEvent.category}</Badge>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white line-clamp-2 mb-4">
              {currentEvent.title}
            </h2>

            <InfoItem icon={Calendar}>{currentEvent.date}</InfoItem>
            <InfoItem icon={MapPin}>{currentEvent.location}</InfoItem>
            <InfoItem icon={DollarSign}>
              Từ {formatPrice(currentEvent.minPrice)} VND
            </InfoItem>
          </div>
        </div>

        {/* Navigation arrows */}
        <Button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white hover:bg-gray-100 text-slate-900 w-12 h-12 p-0"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <Button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white hover:bg-gray-100 text-slate-900 w-12 h-12 p-0"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 pb-8 pt-4">
          {carouselEvents.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === safeIndex
                  ? "bg-primary w-8"
                  : "bg-gray-500 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) => {
  return (
    <div className="flex items-start gap-3 text-white">
      <Icon className="w-6 h-6 shrink-0" />
      <p>{children}</p>
    </div>
  );
};
