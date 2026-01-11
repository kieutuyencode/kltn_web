"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateProfile, getProfile, postUploadFile } from "~/api";
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  ImageUpload,
  Input,
  Textarea,
} from "~/components";
import { TUser } from "~/types";
import { getResourceClientUrlWithDefaultAvatar } from "~/utils";

const formSchema = z.object({
  fullName: z
    .string("Họ tên không hợp lệ.")
    .min(1, "Họ tên không được để trống.")
    .max(100, "Họ tên không được vượt quá 100 ký tự."),
  email: z.string().email("Email không hợp lệ."),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9]{10,11}$/.test(val),
      "Số điện thoại phải có 10-11 chữ số."
    ),
  description: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      "Mô tả không được vượt quá 500 ký tự."
    ),
  avatar: z.string().optional(),
});

type FormDto = z.infer<typeof formSchema>;

type PersonalInfoFormProps = {
  user?: TUser;
};

export function PersonalInfoForm({ user }: PersonalInfoFormProps) {
  const queryClient = useQueryClient();
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar ? getResourceClientUrlWithDefaultAvatar(user.avatar) : null
  );

  const form = useForm<FormDto>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      description: user?.description || "",
      avatar: user?.avatar || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (result) => {
      toast.success(result.message || "Cập nhật thông tin thành công");
      queryClient.invalidateQueries({ queryKey: getProfile.queryKey });
      // Reset avatar state sau khi cập nhật thành công
      setAvatarFileName(null);
    },
  });

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setAvatarFileName(null);
      setAvatarPreview(
        user?.avatar ? getResourceClientUrlWithDefaultAvatar(user.avatar) : null
      );
      form.setValue("avatar", user?.avatar || "");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const response = await postUploadFile(file);
      if (response.data && response.data.length > 0) {
        const fileName = response.data[0];
        setAvatarFileName(fileName);
        form.setValue("avatar", fileName);
        // Tạo preview từ file local
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        throw new Error("Upload thất bại");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Upload ảnh đại diện thất bại"
      );
      setAvatarFileName(null);
      setAvatarPreview(
        user?.avatar ? getResourceClientUrlWithDefaultAvatar(user.avatar) : null
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onSubmit = (data: FormDto) => {
    // Chỉ gửi avatar nếu có file name mới
    // Backend chỉ hỗ trợ fullName, phone, và avatar
    const submitData = {
      fullName: data.fullName,
      phone: data.phone,
      description: data.description || undefined,
      ...(avatarFileName && { avatar: avatarFileName }),
    };
    updateProfileMutation.mutate(submitData);
  };

  // Reset form khi user data thay đổi
  React.useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        description: user.description || "",
        avatar: user.avatar || "",
      });
      setAvatarPreview(
        user.avatar ? getResourceClientUrlWithDefaultAvatar(user.avatar) : null
      );
      setAvatarFileName(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <form id="personal-info" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field>
          <FieldLabel>Ảnh đại diện</FieldLabel>
          <ImageUpload
            className="h-48 max-w-md"
            onFileChange={handleFileChange}
            initialImage={avatarPreview}
          />
          {isUploadingAvatar && (
            <p className="text-sm text-muted-foreground mt-2">
              Đang tải ảnh lên...
            </p>
          )}
        </Field>

        <Controller
          name="fullName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="fullName">Họ tên</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="fullName"
                type="text"
                placeholder="Nhập họ tên"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="email"
                type="email"
                placeholder="Nhập email"
                disabled
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="phone"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="phone"
                type="tel"
                placeholder="Nhập số điện thoại"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="description">Mô tả</FieldLabel>
              <Textarea
                {...field}
                aria-invalid={fieldState.invalid}
                id="description"
                placeholder="Nhập mô tả về bản thân"
                rows={4}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <Button
            type="submit"
            form="personal-info"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending
              ? "Đang cập nhật..."
              : "Cập nhật thông tin"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
