import { RESOURCES_CLIENT_URL } from "~/constants";

export const getResourceClientUrl = (src: string) => {
  return `${RESOURCES_CLIENT_URL}/${src}`;
};

export const getResourceClientUrlWithDefaultAvatar = (src?: string) => {
  if (!src) {
    return "/user";
  }

  return `${RESOURCES_CLIENT_URL}/${src}`;
};
