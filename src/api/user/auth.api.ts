import { TResponse, TUser } from "~/types";
import { axiosAPI } from "~/utils";

type TPostSignInResponse = TResponse<{
  accessToken: string;
  user: TUser;
}>;
export const postSignIn = async (body: any): Promise<TPostSignInResponse> => {
  const response = await axiosAPI.post("/user/auth/sign-in", body);
  return response.data;
};

type TPostSignUpResponse = TResponse<TUser>;
export const postSignUp = async (body: any): Promise<TPostSignUpResponse> => {
  const response = await axiosAPI.post("/user/auth/sign-up", body);
  return response.data;
};

type TPostVerifyEmailResponse = TResponse;
export const postVerifyEmail = async (
  body: any
): Promise<TPostVerifyEmailResponse> => {
  const response = await axiosAPI.post("/user/auth/verify-email", body);
  return response.data;
};

type TPostResendVerifyEmailResponse = TResponse;
export const postResendVerifyEmail = async (
  body: any
): Promise<TPostResendVerifyEmailResponse> => {
  const response = await axiosAPI.post("/user/auth/resend-verify-email", body);
  return response.data;
};

type TPostForgotPasswordResponse = TResponse;
export const postForgotPassword = async (
  body: any
): Promise<TPostForgotPasswordResponse> => {
  const response = await axiosAPI.post("/user/auth/forgot-password", body);
  return response.data;
};

type TPostResetPasswordResponse = TResponse;
export const postResetPassword = async (
  body: any
): Promise<TPostResetPasswordResponse> => {
  const response = await axiosAPI.post("/user/auth/reset-password", body);
  return response.data;
};

type TPostChangePasswordResponse = TResponse;
export const postChangePassword = async (
  body: any
): Promise<TPostChangePasswordResponse> => {
  const response = await axiosAPI.post("/user/auth/change-password", body);
  return response.data;
};
