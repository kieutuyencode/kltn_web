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
import { postSignUp } from "~/api";

const formSchema = z
  .object({
    fullName: z
      .string("Họ và tên không hợp lệ.")
      .min(3, "Họ và tên phải có ít nhất 3 kí tự.")
      .max(50, "Họ và tên phải có tối đa 50 kí tự."),
    email: z.email("Email không hợp lệ."),
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

type FormDto = z.infer<typeof formSchema>;

type SignUpProps = {
  openSignIn: () => void;
  openEmailVerification: (email: string) => void;
  close: () => void;
};

export const SignUp = ({
  openSignIn,
  openEmailVerification,
  close,
}: SignUpProps) => {
  const form = useForm<FormDto>({
    resolver: zodResolver(formSchema),
  });

  const postSignUpMutation = useMutation({
    mutationFn: postSignUp,
  });

  const onSubmit = (data: FormDto) => {
    postSignUpMutation.mutate(
      {
        email: data.email,
        fullName: data.fullName,
        password: data.password,
      },
      {
        onSuccess: (result) => {
          toast.success(result.message || "Đăng ký thành công!");
          // Sau khi đăng ký thành công, chuyển sang dialog xác thực email
          openEmailVerification(data.email);
        },
      }
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-center">Đăng ký</DialogTitle>
      </DialogHeader>

      <form id="sign-up" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="fullName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="fullName">Họ và tên</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  id="fullName"
                  type="text"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  id="password"
                  type="password"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="confirmPassword">
                  Xác nhận mật khẩu
                </FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  id="confirmPassword"
                  type="password"
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
              form="sign-up"
              disabled={postSignUpMutation.isPending}
            >
              {postSignUpMutation.isPending ? "Đang xử lý..." : "Đăng ký"}
            </Button>
          </Field>

          <Field>
            <FieldDescription className="text-center">
              Đã có tài khoản?{" "}
              <span
                className="underline underline-offset-4 hover:text-foreground cursor-pointer"
                onClick={openSignIn}
              >
                Đăng nhập
              </span>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </>
  );
};
