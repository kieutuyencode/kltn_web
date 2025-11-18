import { TResponse, TUser } from "~/types";
import { axiosAPI } from "~/utils";

type TGetProfileResponse = TResponse<TUser>;
export const getProfile = async (): Promise<TGetProfileResponse> => {
  const response = await axiosAPI.get("/user/profile");
  return response.data;
};
getProfile.queryKey = ["profile"];

type TUpdateProfileResponse = TResponse<TUser>;
export const updateProfile = async (
  body: any
): Promise<TUpdateProfileResponse> => {
  const response = await axiosAPI.patch("/user/profile", body);
  return response.data;
};
