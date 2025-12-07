"use client";

import {
  ArrowLeft,
  CheckSquare,
  Edit2,
  FileText,
  History,
  PieChart,
} from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
  useParams,
} from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components";

const navItems = [
  {
    title: "Tổng kết",
    url: "summary",
    icon: PieChart,
  },
  {
    title: "Danh sách đơn hàng",
    url: "orders",
    icon: FileText,
  },
  {
    title: "Check-in",
    url: "check-in",
    icon: CheckSquare,
  },
  {
    title: "Lịch sử thanh toán",
    url: "payment-history",
    icon: History,
  },
  {
    title: "Chỉnh sửa",
    url: "edit",
    icon: Edit2,
  },
];

export function OrganizerSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const handleNavigation = (url: string) => {
    const eventId = (params?.id as string) || searchParams.get("eventId");
    const scheduleId = searchParams.get("scheduleId");

    if (!eventId) {
      router.push("/organizer/manage");
      return;
    }

    // Nếu là trang edit, đi thẳng đến create-event
    if (url === "edit") {
      router.push(`/organizer/create-event?edit=${eventId}`);
      return;
    }

    const queryParams = new URLSearchParams();
    if (scheduleId) queryParams.set("scheduleId", scheduleId);

    const queryString = queryParams.toString();
    router.push(
      `/manage-events/${eventId}/${url}${
        queryString ? `?${queryString}` : ""
      }`
    );
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Quản trị sự kiện"
                onClick={() => router.push("/organizer/manage")}
              >
                <div className="cursor-pointer">
                  <ArrowLeft />
                  <span>Quản trị sự kiện</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {navItems.map((item) => {
              const eventId = params?.id as string;
              // Đối với edit, check active bằng cách xem có query param edit không
              const isEditActive = item.url === "edit" && pathname === "/organizer/create-event";
              const currentPath = eventId
                ? `/manage-events/${eventId}/${item.url}`
                : item.url;
              const isActive =
                isEditActive ||
                (pathname === currentPath || pathname.endsWith(`/${item.url}`));

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                    onClick={() => item.url && handleNavigation(item.url)}
                  >
                    <div className="cursor-pointer">
                      <item.icon />
                      <span>{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
