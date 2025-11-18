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
