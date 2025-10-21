"use client";

import {
  Calendar,
  ChevronRight,
  House,
  LogIn,
  LogOut,
  Ticket,
  User,
} from "lucide-react";
import * as React from "react";
// Thêm hook usePathname
import { usePathname } from "next/navigation";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "~/components";

// Thêm cấu trúc menu với các mục con (sub-items) để minh họa
const navBar = [
  {
    title: "Trang chủ",
    icon: House,
    url: "/",
  },
  {
    title: "Lịch sử đặt vé",
    icon: Ticket,
    url: "/ticket",
  },
  {
    title: "Tổ chức sự kiện",
    icon: Calendar,
    url: "/organizer/create",
    items: [
      {
        title: "Tạo sự kiện",
        url: "/organizer/create",
      },
      {
        title: "Quản lý sự kiện",
        url: "/organizer/manage",
      },
      {
        title: "Quản lý doanh thu",
        url: "/organizer/revenue",
      },
    ],
  },
  {
    title: "Thông tin cá nhân",
    icon: User,
    url: "/account",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Lấy đường dẫn URL hiện tại
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navBar.map((item) => {
              // Kiểm tra xem menu cha hoặc một trong các menu con có active không
              const isParentActive = pathname === item.url;
              const isChildActive =
                item.items?.some((subItem) => pathname === subItem.url) ??
                false;
              const isActive = isParentActive || isChildActive;

              return (
                <Collapsible
                  key={item.title}
                  asChild
                  // Mở mục menu nếu nó đang active
                  defaultOpen={isActive}
                >
                  {/* Thêm data-active cho SidebarMenuItem */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                    {item.items?.length ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuAction className="data-[state=open]:rotate-90">
                            <ChevronRight />
                            <span className="sr-only">Toggle</span>
                          </SidebarMenuAction>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => {
                              // Kiểm tra xem mục con có active không
                              const isSubItemActive = pathname === subItem.url;

                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isSubItemActive}
                                  >
                                    <a href={subItem.url}>
                                      <span>{subItem.title}</span>
                                    </a>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : null}
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button variant="outline">
          <LogOut />
          Đăng xuất
        </Button>

        <Button variant="outline">
          <LogIn />
          Đăng nhập
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
