import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  userAccessToken: string | null;
  walletAccessToken: string | null;
  setUserAccessToken: (token: string | null) => void;
  setWalletAccessToken: (token: string | null) => void;
  clearTokens: () => void;
}

// Custom storage để đồng bộ với localStorage keys cũ
const customStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;

    // Kiểm tra xem zustand storage đã tồn tại chưa
    const zustandStorage = window.localStorage.getItem(name);

    // Lần đầu tiên mở web (chưa có zustand storage), load từ localStorage keys cũ
    if (!zustandStorage) {
      const userAccessToken = window.localStorage.getItem("userAccessToken");
      const walletAccessToken =
        window.localStorage.getItem("walletAccessToken");

      // Nếu có tokens trong localStorage cũ, migrate vào zustand storage
      if (userAccessToken || walletAccessToken) {
        return JSON.stringify({
          state: {
            userAccessToken,
            walletAccessToken,
          },
          version: 0,
        });
      }

      // Không có tokens trong localStorage cũ, trả về null để dùng initial state
      return null;
    }

    // Đã có zustand storage, sử dụng nó
    return zustandStorage;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    const parsed = JSON.parse(value);

    // Lấy state cũ để so sánh
    const oldStorage = window.localStorage.getItem(name);
    let oldUserToken: string | null | undefined = undefined;
    let oldWalletAccessToken: string | null | undefined = undefined;

    if (oldStorage) {
      try {
        const oldParsed = JSON.parse(oldStorage);
        oldUserToken = oldParsed.state?.userAccessToken;
        oldWalletAccessToken = oldParsed.state?.walletAccessToken;
      } catch {
        // Ignore parse error
      }
    }

    const newUserToken = parsed.state?.userAccessToken;
    const newWalletAccessToken = parsed.state?.walletAccessToken;

    // Chỉ update userAccessToken trong localStorage nếu giá trị thay đổi
    if (newUserToken !== oldUserToken) {
      if (newUserToken) {
        window.localStorage.setItem("userAccessToken", newUserToken);
      } else {
        window.localStorage.removeItem("userAccessToken");
      }
    }

    // Chỉ update walletAccessToken trong localStorage nếu giá trị thay đổi
    if (newWalletAccessToken !== oldWalletAccessToken) {
      if (newWalletAccessToken) {
        window.localStorage.setItem("walletAccessToken", newWalletAccessToken);
      } else {
        window.localStorage.removeItem("walletAccessToken");
      }
    }

    // Luôn update zustand storage
    window.localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
    window.localStorage.removeItem("userAccessToken");
    window.localStorage.removeItem("walletAccessToken");
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userAccessToken: null,
      walletAccessToken: null,
      setUserAccessToken: (token) => set({ userAccessToken: token }),
      setWalletAccessToken: (token) => set({ walletAccessToken: token }),
      clearTokens: () =>
        set({
          userAccessToken: null,
          walletAccessToken: null,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => customStorage),
    }
  )
);
