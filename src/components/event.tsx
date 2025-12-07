import Image from "next/image";
import Link from "next/link";
import { Badge, Card, Separator } from "./ui";
import { formatPrice } from "~/utils";

type TEvent = {
  id: string;
  slug: string;
  image: string;
  category: string;
  date: string;
  title: string;
  location?: string;
  minPrice?: number;
};

export const EventCard = ({ event }: { event: TEvent }) => {
  const minPrice = event.minPrice ?? 500000;

  return (
    <Link href={`/events/${event.slug}`} className="h-full">
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group py-0 gap-0">
        <div className="relative w-full aspect-video overflow-hidden bg-muted shrink-0">
          <Image
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="p-3 space-y-2 flex-1 flex flex-col">
          <Badge variant="outline" className="w-fit">
            {event.category}
          </Badge>

          <p className="text-xs text-muted-foreground">{event.date}</p>

          <h3 className="font-bold line-clamp-2 text-foreground flex-1">
            {event.title}
          </h3>

          <Separator />

          <p className="font-bold text-primary">
            Từ {formatPrice(minPrice)} EVT
          </p>
        </div>
      </Card>
    </Link>
  );
};

export const EventGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
};
