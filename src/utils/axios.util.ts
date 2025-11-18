import axios from "axios";
import { API_URL } from "~/constants";
import { useAuthStore } from "~/stores";

export const axiosAPI = axios.create({
  baseURL: API_URL,
});

axiosAPI.interceptors.request.use((req) => {
  // Lấy tokens từ zustand store
  const userAccessToken = useAuthStore.getState().userAccessToken;
  const walletAccessToken = useAuthStore.getState().walletAccessToken;

  if (userAccessToken) {
    req.headers["userAccessToken"] = userAccessToken;
  }

  if (walletAccessToken) {
    req.headers["walletAccessToken"] = walletAccessToken;
  }

  return req;
});

axiosAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const store = useAuthStore.getState();
      const errorMessage = error.response.data?.message;

      // Chuyển message sang lowercase để so sánh không phân biệt hoa thường
      const lowerMessage = errorMessage.toLowerCase();

      // Kiểm tra message để xác định token nào bị invalid
      const isUserTokenError = lowerMessage.includes(
        "Phiên đăng nhập đã hết hạn".toLowerCase()
      );

      const isWalletAccessTokenError = lowerMessage.includes(
        "Phiên đăng nhập ví đã hết hạn".toLowerCase()
      );

      // Remove token tương ứng dựa vào message
      if (isUserTokenError) {
        store.setUserAccessToken(null);
      }
      if (isWalletAccessTokenError) {
        store.setWalletAccessToken(null);
      }

      if (!store.userAccessToken) {
        const currentPath = window.location.pathname;

        // Nếu đang ở đường dẫn có chứa "admin" → redirect về /admin
        if (currentPath.includes("/admin")) {
          window.location.href = "/admin";
        } else {
          // Ngược lại → redirect về /
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);
