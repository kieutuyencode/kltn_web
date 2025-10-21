"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Button } from "~/components";
import { Events } from "~/data";

interface CarouselEvent {
  id: string;
  image: string;
  title: string;
  category: string;
  date: string;
  performers: string[];
  showtime: string;
  venue: string;
  location: string;
  hotline: string;
  email: string;
  description: string;
  minPrice: number;
}

const carouselEvents: CarouselEvent[] = Events.slice(0, 4).map(
  (event, index) => ({
    id: event.id,
    image: event.image,
    title: event.title,
    category: event.category,
    date: event.date,
    performers: [event.category === "Fan Meeting" ? "Fan Meeting" : "Nghệ sĩ"],
    showtime: ["17:00", "19:30", "20:00", "18:00"][index % 4],
    venue: event.title.split(" ").slice(0, 3).join(" "),
    location: event.date.split(", ").slice(0, -1).join(", "),
    hotline: "1900 636 686",
    email: "CHAT@CTICKET.VN",
    description: `"${event.title}"`,
    minPrice: 500000,
  })
);

export const EventCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const currentEvent = carouselEvents[currentIndex];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden rounded-lg">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Main carousel content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 lg:p-12 min-h-96">
          {/* Left side - Image */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full h-full max-w-sm">
              <Image
                src={currentEvent.image}
                alt={currentEvent.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Right side - Event details */}
          <div className="hidden lg:block">
            <div className="flex flex-col justify-center space-y-6 text-white">
              {/* Category */}
              <div className="space-y-2">
                <Badge variant="secondary">{currentEvent.category}</Badge>
              </div>

              {/* Title */}
              <h2 className="text-5xl font-bold text-red-400 line-clamp-2">
                {currentEvent.title}
              </h2>

              {/* Description */}
              <p className="text-gray-300 italic line-clamp-5">
                {currentEvent.description}
              </p>

              {/* Showtime badge */}
              <p className="text-xs text-gray-400">{currentEvent.date}</p>

              <div className="pt-4 border-t border-red-400/20">
                <div className="text-xs text-gray-400 mb-1">GIÁ VÉ TỪ</div>
                <div className="text-2xl font-bold text-red-400">
                  {formatPrice(currentEvent.minPrice)}đ
                </div>
              </div>
            </div>
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
                index === currentIndex
                  ? "bg-red-400 w-8"
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
