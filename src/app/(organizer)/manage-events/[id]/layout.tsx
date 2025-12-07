import { OrganizerSidebar } from "../../components/organizer-sidebar";
import { EventHeader } from "../../components/event-header";
import { SidebarInset, SidebarProvider } from "~/components";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <OrganizerSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <EventHeader />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

