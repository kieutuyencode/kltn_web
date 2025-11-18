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
import { postSignIn } from "~/api";
import { useAuthStore } from "~/stores";

const formSchema = z.object({
  email: z.email("Email không hợp lệ."),
  password: z
    .string("Mật khẩu không hợp lệ.")
    .min(6, "Mật khẩu phải có ít nhất 6 kí tự.")
    .max(50, "Mật khẩu phải có tối đa 50 kí tự."),
});
type FormDto = z.infer<typeof formSchema>;

type SignInProps = {
  openSignUp: () => void;
  openForgotPassword: () => void;
  openEmailVerification: () => void;
  close: () => void;
};
export const SignIn = ({
  openSignUp,
  openForgotPassword,
  openEmailVerification,
  close,
}: SignInProps) => {
  const authStore = useAuthStore();
  const form = useForm<FormDto>({
    resolver: zodResolver(formSchema),
  });
  const postSignInMutation = useMutation({
    mutationFn: postSignIn,
  });

  const onSubmit = (data: FormDto) => {
    postSignInMutation.mutate(data, {
      onSuccess: (result) => {
        toast.success(result.message);
        authStore.setUserAccessToken(result.data.accessToken);
        close();
      },
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-center">Đăng nhập</DialogTitle>
      </DialogHeader>

      <form id="sign-in" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
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

          <Field>
            <Button
              type="submit"
              form="sign-in"
              disabled={postSignInMutation.isPending}
            >
              {postSignInMutation.isPending ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </Field>

          <Field>
            <FieldDescription className="text-center">
              <span
                className="underline underline-offset-4 hover:text-foreground cursor-pointer"
                onClick={openForgotPassword}
              >
                Quên mật khẩu?
              </span>
            </FieldDescription>

            <FieldDescription className="text-center">
              <span
                className="underline underline-offset-4 hover:text-foreground cursor-pointer"
                onClick={openEmailVerification}
              >
                Xác thực email
              </span>
            </FieldDescription>

            <FieldDescription className="text-center">
              Chưa có tài khoản?{" "}
              <span
                className="underline underline-offset-4 hover:text-foreground cursor-pointer"
                onClick={openSignUp}
              >
                Đăng ký
              </span>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </>
  );
};
