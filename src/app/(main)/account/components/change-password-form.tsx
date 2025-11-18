"use client";

import React from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { postChangePassword } from "~/api";
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "~/components";

const formSchema = z
  .object({
    currentPassword: z
      .string("Mật khẩu hiện tại không hợp lệ.")
      .min(1, "Mật khẩu hiện tại không được để trống.")
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự.")
      .max(50, "Mật khẩu không được vượt quá 50 ký tự."),
    newPassword: z
      .string("Mật khẩu mới không hợp lệ.")
      .min(1, "Mật khẩu mới không được để trống.")
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự.")
      .max(50, "Mật khẩu mới không được vượt quá 50 ký tự."),
    confirmPassword: z
      .string("Xác nhận mật khẩu không hợp lệ.")
      .min(1, "Xác nhận mật khẩu không được để trống."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu mới và xác nhận mật khẩu không khớp.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
    path: ["newPassword"],
  });

type FormDto = z.infer<typeof formSchema>;

export function ChangePasswordForm() {
  const form = useForm<FormDto>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: postChangePassword,
    onSuccess: (result) => {
      toast.success(result.message || "Đổi mật khẩu thành công");
      form.reset();
    },
  });

  const onSubmit = (data: FormDto) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <form id="change-password" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="currentPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="currentPassword">
                Mật khẩu hiện tại
              </FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="currentPassword"
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="newPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="newPassword">Mật khẩu mới</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="newPassword"
                type="password"
                placeholder="Nhập mật khẩu mới"
                autoComplete="new-password"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="confirmPassword">
                Xác nhận mật khẩu mới
              </FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <Button
            type="submit"
            form="change-password"
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending
              ? "Đang đổi mật khẩu..."
              : "Đổi mật khẩu"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
