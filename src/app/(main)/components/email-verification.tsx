"use client";
import {
  Button,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "~/components";
import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { postResendVerifyEmail, postVerifyEmail } from "~/api";

const requestOTPFormSchema = z.object({
  email: z.email("Email không hợp lệ."),
});

type RequestOTPFormDto = z.infer<typeof requestOTPFormSchema>;

type RequestEmailVerificationOTPProps = {
  onOTPSent: (email: string) => void;
  openSignIn: () => void;
};

export const RequestEmailVerificationOTP = ({
  onOTPSent,
  openSignIn,
}: RequestEmailVerificationOTPProps) => {
  const form = useForm<RequestOTPFormDto>({
    resolver: zodResolver(requestOTPFormSchema),
  });

  const postResendVerifyEmailMutation = useMutation({
    mutationFn: postResendVerifyEmail,
  });

  const onSubmit = (data: RequestOTPFormDto) => {
    postResendVerifyEmailMutation.mutate(
      { email: data.email },
      {
        onSuccess: (result) => {
          toast.success(
            result.message || "Mã xác thực đã được gửi đến email của bạn!"
          );
          onOTPSent(data.email);
        },
      }
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-center">Xác thực email</DialogTitle>
      </DialogHeader>
      <form
        id="request-email-verification-otp"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <Field>
            <FieldDescription>
              Nhập email của bạn. Chúng tôi sẽ gửi một mã OTP gồm 6 chữ số để
              xác thực email.
            </FieldDescription>
          </Field>

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
                  autoComplete="email"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Field>
            <Button
              type="submit"
              form="request-email-verification-otp"
              disabled={postResendVerifyEmailMutation.isPending}
            >
              {postResendVerifyEmailMutation.isPending
                ? "Đang gửi..."
                : "Gửi mã OTP"}
            </Button>
          </Field>

          <Field>
            <FieldDescription className="text-center">
              <span
                className="underline underline-offset-4 hover:text-foreground cursor-pointer"
                onClick={openSignIn}
              >
                Quay lại Đăng nhập
              </span>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </>
  );
};

const verifyEmailFormSchema = z.object({
  otp: z
    .string("Mã OTP không hợp lệ.")
    .min(6, "Mã OTP phải có 6 chữ số.")
    .max(6, "Mã OTP phải có 6 chữ số."),
});

type VerifyEmailFormDto = z.infer<typeof verifyEmailFormSchema>;

type VerifyEmailProps = {
  email: string;
  openSignIn: () => void;
};

export const VerifyEmail = ({ email, openSignIn }: VerifyEmailProps) => {
  const form = useForm<VerifyEmailFormDto>({
    resolver: zodResolver(verifyEmailFormSchema),
  });

  const postVerifyEmailMutation = useMutation({
    mutationFn: postVerifyEmail,
  });

  const onSubmit = (data: VerifyEmailFormDto) => {
    postVerifyEmailMutation.mutate(
      { email, code: data.otp },
      {
        onSuccess: (result) => {
          toast.success(
            result.message || "Email của bạn đã được xác thực thành công!"
          );
          openSignIn(); // Chuyển người dùng đến trang đăng nhập
        },
      }
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-center">Xác thực email</DialogTitle>
      </DialogHeader>
      <form id="verify-email" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field>
            <FieldLabel>Nhập mã OTP</FieldLabel>
            <FieldDescription>
              Chúng tôi đã gửi mã OTP đến email <strong>{email}</strong>. Vui
              lòng nhập mã để xác thực.
            </FieldDescription>
          </Field>

          <Controller
            name="otp"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="otp">Mã OTP</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  id="otp"
                  type="text"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Field>
            <Button
              type="submit"
              form="verify-email"
              disabled={postVerifyEmailMutation.isPending}
            >
              {postVerifyEmailMutation.isPending
                ? "Đang xác thực..."
                : "Xác thực"}
            </Button>
          </Field>

          <Field>
            <FieldDescription className="text-center">
              <span
                className="underline underline-offset-4 hover:text-foreground cursor-pointer"
                onClick={openSignIn}
              >
                Quay lại Đăng nhập
              </span>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </>
  );
};
