import { TResponse } from "~/types";
import { axiosAPI } from "~/utils";

type TPostSignInWalletResponse = TResponse<{
  accessToken: string;
}>;
export const postSignInWallet = async (
  body: any
): Promise<TPostSignInWalletResponse> => {
  const response = await axiosAPI.post("/wallet/sign-in", body);
  return response.data;
};
