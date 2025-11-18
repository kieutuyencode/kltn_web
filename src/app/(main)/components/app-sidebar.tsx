"use client";

import {
  Calendar,
  ChevronRight,
  House,
  LogIn,
  LogOut,
  Ticket,
  User,
  Settings,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { RequestEmailVerificationOTP, VerifyEmail } from "./email-verification";
import { useAuthStore } from "~/stores";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "~/api";
import { getResourceClientUrlWithDefaultAvatar } from "~/utils";

// Danh sách các route cần đăng nhập
const protectedRoutes = [
  "/account",
  "/ticket",
  "/organizer/create-event",
  "/organizer/manage",
  "/organizer/revenue",
];

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
    url: "/organizer/create-event",
    items: [
      {
        title: "Tạo sự kiện",
        url: "/organizer/create-event",
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
    title: "Tài khoản",
    icon: User,
    url: "/account",
  },
];

type AuthFormType =
  | "signIn"
  | "signUp"
  | "requestOtp"
  | "verifyOtp"
  | "requestEmailVerificationOTP"
  | "verifyEmail";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Lấy đường dẫn URL hiện tại
  const pathname = usePathname();
  const router = useRouter();
  // State để quản lý việc mở/đóng Dialog chung
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  // State để quyết định form nào sẽ hiển thị
  const [authFormType, setAuthFormType] = useState<AuthFormType>("signIn");
  // State mới để lưu email giữa các bước (cho reset password)
  const [emailForReset, setEmailForReset] = useState<string>("");
  // State để lưu email cho xác thực email
  const [emailForVerification, setEmailForVerification] = useState<string>("");

  // Hàm để mở Dialog và đặt loại form
  const openAuthModal = (type: AuthFormType) => {
    setAuthFormType(type);
    setAuthModalOpen(true);
  };

  // Hàm đóng Dialog và reset về form đăng nhập mặc định
  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Hàm được gọi sau khi gửi OTP thành công (cho reset password)
  const handleOTPSent = (sentEmail: string) => {
    setEmailForReset(sentEmail); // Lưu email
    setAuthFormType("verifyOtp"); // Chuyển sang form xác thực
  };

  // Hàm được gọi sau khi gửi OTP xác thực email thành công
  const handleEmailVerificationOTPSent = (sentEmail: string) => {
    setEmailForVerification(sentEmail); // Lưu email
    setAuthFormType("verifyEmail"); // Chuyển sang form xác thực email
  };

  // Hàm để mở dialog xác thực email (có thể từ SignIn hoặc SignUp)
  const handleOpenEmailVerification = (email?: string) => {
    if (email) {
      // Nếu có email (từ SignUp), chuyển thẳng sang form nhập OTP
      setEmailForVerification(email);
      setAuthFormType("verifyEmail");
    } else {
      // Nếu không có email (từ SignIn), hiển thị form nhập email trước
      setEmailForVerification("");
      setAuthFormType("requestEmailVerificationOTP");
    }
  };

  const authStore = useAuthStore();
  const isAuthenticated = !!authStore.userAccessToken;

  const getProfileQuery = useQuery({
    queryKey: getProfile.queryKey,
    queryFn: getProfile,
    enabled: isAuthenticated,
  });
  const user = getProfileQuery.data?.data;

  // Hàm xử lý navigation với kiểm tra authentication
  const handleNavigation = (url: string) => {
    // Kiểm tra xem route có cần đăng nhập không
    const isProtected = protectedRoutes.some((route) => url.startsWith(route));

    // Nếu route cần đăng nhập và user chưa đăng nhập, mở dialog đăng nhập
    if (isProtected && !isAuthenticated) {
      openAuthModal("signIn");
      return;
    }

    // Nếu đã đăng nhập hoặc route không cần đăng nhập, điều hướng bình thường
    router.push(url);
  };

  // Hàm xử lý đăng xuất
  const handleSignOut = () => {
    authStore.setUserAccessToken(null);
    router.push("/");
  };

  const renderAuthForm = () => {
    switch (authFormType) {
      case "signUp":
        return (
          <SignUp
            openSignIn={() => setAuthFormType("signIn")}
            openEmailVerification={handleOpenEmailVerification}
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
      case "requestEmailVerificationOTP":
        return (
          <RequestEmailVerificationOTP
            onOTPSent={handleEmailVerificationOTPSent}
            openSignIn={() => setAuthFormType("signIn")}
          />
        );
      case "verifyEmail":
        return (
          <VerifyEmail
            email={emailForVerification} // Sử dụng email đã lưu
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
            // Khi nhấn "Xác thực email", chuyển sang dialog xác thực email
            openEmailVerification={() => handleOpenEmailVerification()}
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
                      <div
                        className="cursor-pointer"
                        onClick={() => handleNavigation(item.url)}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </div>
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
                                    <div
                                      className="cursor-pointer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleNavigation(subItem.url);
                                      }}
                                    >
                                      <span>{subItem.title}</span>
                                    </div>
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
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-2 px-3"
              >
                <Avatar className="size-8">
                  <AvatarImage
                    className="object-cover"
                    src={getResourceClientUrlWithDefaultAvatar(user?.avatar)}
                    alt={user?.fullName}
                  />
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="font-medium truncate w-full text-left">
                    {user?.fullName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full text-left">
                    {user?.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              side="right"
              sideOffset={8}
            >
              <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  handleNavigation("/account");
                }}
              >
                <User className="mr-2 size-4" />
                Tài khoản
              </DropdownMenuItem>

              {/* <DropdownMenuItem
                onClick={() => {
                  router.push("/account");
                }}
              >
                <Settings className="mr-2 size-4" />
                Cài đặt
              </DropdownMenuItem> */}

              {/* <DropdownMenuSeparator /> */}

              <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                <LogOut className="mr-2 size-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => openAuthModal("signIn")}
          >
            <LogIn className="mr-2 size-4" />
            Đăng nhập
          </Button>
        )}
      </SidebarFooter>

      {/* Dialog luôn sẵn sàng để có thể mở từ bất kỳ đâu */}
      <Dialog open={isAuthModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {renderAuthForm()}
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
