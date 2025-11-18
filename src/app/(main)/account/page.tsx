"use client";

import { useQuery } from "@tanstack/react-query";
import { getProfile } from "~/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components";
import { useAuthStore } from "~/stores";
import { PersonalInfoForm, ChangePasswordForm } from "./components";

export default function AccountPage() {
  const authStore = useAuthStore();
  const isAuthenticated = !!authStore.userAccessToken;

  const getProfileQuery = useQuery({
    queryKey: getProfile.queryKey,
    queryFn: getProfile,
    enabled: isAuthenticated,
  });

  const user = getProfileQuery.data?.data;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          Vui lòng đăng nhập để xem thông tin cá nhân
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Thông tin tài khoản</h1>

      <Tabs defaultValue="personal-info" className="w-full">
        <TabsList>
          <TabsTrigger value="personal-info">Thông tin cá nhân</TabsTrigger>
          <TabsTrigger value="change-password">Đổi mật khẩu</TabsTrigger>
        </TabsList>

        <TabsContent value="personal-info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent>
              <PersonalInfoForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="change-password" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
