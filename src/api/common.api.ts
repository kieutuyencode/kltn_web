import { TResponse } from "~/types";
import { axiosAPI } from "~/utils";

type TPostUploadFileResponse = TResponse<string[]>;
export const postUploadFile = async (
  files: File | File[]
): Promise<TPostUploadFileResponse> => {
  const formData = new FormData();

  // Hỗ trợ cả single file và multiple files
  const filesArray = Array.isArray(files) ? files : [files];

  filesArray.forEach((file) => {
    formData.append("files", file);
  });

  const response = await axiosAPI.post("/file/upload", formData);

  return response.data;
};

// Get Client Config
type TClientConfig = {
  VERIFY_EMAIL_CODE_EXPIRES_IN_MINUTES?: string;
  RESET_PASSWORD_CODE_EXPIRES_IN_MINUTES?: string;
  SELL_TICKET_FEE_RATE?: string;
};
type TGetClientConfigResponse = TResponse<TClientConfig>;
export const getClientConfig = async (): Promise<TGetClientConfigResponse> => {
  const response = await axiosAPI.get("/config");
  return response.data;
};
getClientConfig.queryKey = () => ["config", "client"];
