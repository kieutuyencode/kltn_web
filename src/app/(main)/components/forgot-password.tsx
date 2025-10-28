"use client";
import {
  Button,
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

const requestOTPFormSchema = z.object({
  email: z.email("Email không hợp lệ."),
});

type RequestOTPFormDto = z.infer<typeof requestOTPFormSchema>;

type RequestOTPProps = {
  onOTPSent: (email: string) => void;
  openSignIn: () => void;
};

export const RequestOTP = ({ onOTPSent, openSignIn }: RequestOTPProps) => {
  const form = useForm<RequestOTPFormDto>({
    resolver: zodResolver(requestOTPFormSchema),
  });

  const onSubmit = (data: RequestOTPFormDto) => {
    console.log("Gửi mã OTP tới email:", data.email);

    onOTPSent(data.email);
  };

  return (
    <form id="request-otp" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field>
          <FieldLabel>Đặt lại mật khẩu</FieldLabel>
          <FieldDescription>
            Nhập email của bạn. Chúng tôi sẽ gửi một mã OTP gồm 6 chữ số để xác
            minh.
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <Button type="submit" form="request-otp">
            Gửi mã OTP
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
  );
};

const verifyAndResetPasswordFormSchema = z
  .object({
    otp: z
      .string("Mã OTP không hợp lệ.")
      .min(6, "Mã OTP phải có 6 chữ số.")
      .max(6, "Mã OTP phải có 6 chữ số."),
    password: z
      .string("Mật khẩu không hợp lệ.")
      .min(6, "Mật khẩu phải có ít nhất 6 kí tự.")
      .max(50, "Mật khẩu phải có tối đa 50 kí tự."),
    confirmPassword: z.string("Mật khẩu xác nhận không hợp lệ."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

type VerifyAndResetPasswordFormDto = z.infer<
  typeof verifyAndResetPasswordFormSchema
>;

type VerifyAndResetPasswordProps = {
  email: string;
  openSignIn: () => void;
};

export const VerifyAndResetPassword = ({
  email,
  openSignIn,
}: VerifyAndResetPasswordProps) => {
  const form = useForm<VerifyAndResetPasswordFormDto>({
    resolver: zodResolver(verifyAndResetPasswordFormSchema),
  });

  const onSubmit = (data: VerifyAndResetPasswordFormDto) => {
    // Xử lý logic xác thực OTP và cập nhật mật khẩu mới
    console.log("Email:", email);
    console.log("OTP:", data.otp);
    console.log("Mật khẩu mới:", data.password);

    // Sau khi API xác nhận thành công
    // alert("Mật khẩu của bạn đã được cập nhật thành công!");
    openSignIn(); // Chuyển người dùng đến trang đăng nhập
  };

  return (
    <form id="verify-reset-password" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field>
          <FieldLabel>Xác thực tài khoản</FieldLabel>
        </Field>

        {/* Trường Mã OTP */}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Trường Mật khẩu mới */}
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="password">Mật khẩu mới</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="password"
                type="password"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Trường Xác nhận mật khẩu mới */}
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
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <Button type="submit" form="verify-reset-password">
            Xác nhận và Đặt lại mật khẩu
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
};
