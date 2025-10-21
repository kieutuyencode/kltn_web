import Image from "next/image";
import { Badge, Card, Separator } from "./ui";

type TEvent = {
  id: string;
  image: string;
  category: string;
  date: string;
  title: string;
  location?: string;
};

export const EventCard = ({ event }: { event: TEvent }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group py-0 gap-0">
      <div className="relative w-full aspect-video overflow-hidden bg-muted">
        <Image
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-3 space-y-2">
        <Badge variant="outline">{event.category}</Badge>

        <p className="text-xs text-muted-foreground">{event.date}</p>

        <h3 className="font-bold line-clamp-2 text-foreground">
          {event.title}
        </h3>

        <Separator />

        <p className="font-bold text-primary">Từ 500.000đ</p>
      </div>
    </Card>
  );
};

export const EventGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
};
