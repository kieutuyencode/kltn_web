import {
  EventCard,
  EventGrid,
  ScrollArea,
  ScrollBar,
  Tabs,
  TabsList,
  TabsTrigger,
} from "~/components";
import { EventCategory, Events } from "~/data";
import { EventCarousel } from "~/app/(main)/components";

export default function Page() {
  return (
    <>
      <EventCarousel />

      <h2 className="text-2xl font-semibold">Sự kiện</h2>

      <ScrollArea>
        <Tabs defaultValue={EventCategory[0].name}>
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

      <EventGrid>
        {Events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </EventGrid>
    </>
  );
}
