import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
} from "~/components";

export const SignIn = () => {
  return (
    <form>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>

          <Input id="password" type="password" required />
        </Field>
        <Field>
          <Button type="submit">Đăng nhập</Button>
        </Field>

        <Field>
          <FieldDescription className="text-center">
            <span className="underline underline-offset-4 hover:text-foreground cursor-pointer">
              Quên mật khẩu?
            </span>
          </FieldDescription>

          <FieldDescription className="text-center">
            Chưa có tài khoản?{" "}
            <span className="underline underline-offset-4 hover:text-foreground cursor-pointer">
              Đăng ký
            </span>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
};
