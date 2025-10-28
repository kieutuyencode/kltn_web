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
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DialogTrigger,
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
import { SignIn } from "./sign-in";
import { SignUp } from "./sign-up";
import { RequestOTP, VerifyAndResetPassword } from "./forgot-password";

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

type AuthFormType = "signIn" | "signUp" | "requestOtp" | "verifyOtp";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Lấy đường dẫn URL hiện tại
  const pathname = usePathname();
  // State để quản lý việc mở/đóng Dialog chung
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  // State để quyết định form nào sẽ hiển thị
  const [authFormType, setAuthFormType] = useState<AuthFormType>("signIn");
  // State mới để lưu email giữa các bước
  const [emailForReset, setEmailForReset] = useState<string>("");

  // Hàm để mở Dialog và đặt loại form
  const openAuthModal = (type: AuthFormType) => {
    setAuthFormType(type);
    setAuthModalOpen(true);
  };

  // Hàm đóng Dialog và reset về form đăng nhập mặc định
  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Hàm được gọi sau khi gửi OTP thành công
  const handleOTPSent = (sentEmail: string) => {
    setEmailForReset(sentEmail); // Lưu email
    setAuthFormType("verifyOtp"); // Chuyển sang form xác thực
  };

  const renderAuthForm = () => {
    switch (authFormType) {
      case "signUp":
        return (
          <SignUp
            openSignIn={() => setAuthFormType("signIn")}
            close={closeAuthModal}
          />
        );
      case "requestOtp":
        return (
          <RequestOTP
            onOTPSent={handleOTPSent}
            openSignIn={() => setAuthFormType("signIn")}
          />
        );
      case "verifyOtp":
        return (
          <VerifyAndResetPassword
            email={emailForReset} // Sử dụng email đã lưu
            openSignIn={() => setAuthFormType("signIn")}
          />
        );
      case "signIn":
      default:
        return (
          <SignIn
            openSignUp={() => setAuthFormType("signUp")}
            // Khi nhấn "Quên mật khẩu", chuyển sang bước yêu cầu OTP
            openForgotPassword={() => {
              setAuthFormType("requestOtp");
              setEmailForReset("");
            }}
            close={closeAuthModal}
          />
        );
    }
  };

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

        <Dialog open={isAuthModalOpen} onOpenChange={setAuthModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => openAuthModal("signIn")}>
              <LogIn />
              Đăng nhập
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            {renderAuthForm()}
          </DialogContent>
        </Dialog>
      </SidebarFooter>
    </Sidebar>
  );
}
