import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export * from "./axios.util";
export * from "./file.util";
export * from "./siwe.util";
export * from "./blockchain.util";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("vi-VN").format(price);
};

export const generateSlug = (name: string) => {
  if (!name) return ""; // Trả về chuỗi rỗng nếu đầu vào không hợp lệ

  return name
    .toString() // Đảm bảo đầu vào là chuỗi
    .replace(/Đ/g, "D") // Thay thế chữ Đ hoa thành D
    .replace(/đ/g, "d") // Thay thế chữ đ thường thành d
    .normalize("NFD") // Chuẩn hóa Unicode, tách dấu
    .replace(/[\u0300-\u036f]/g, "") // Xóa các ký tự dấu
    .toLowerCase() // Chuyển thành chữ thường
    .trim() // Xóa khoảng trắng ở đầu và cuối
    .replace(/\s+/g, "-") // Thay thế khoảng trắng bằng dấu gạch ngang
    .replace(/[^\w-]+/g, "") // Xóa các ký tự không hợp lệ
    .replace(/--+/g, "-"); // Thay thế nhiều dấu gạch ngang liên tiếp
};

// Format date with weekday (e.g., "Thứ Hai, 21 tháng 12 năm 2024")
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Format date short numeric (e.g., "21/12/2024")
export const formatDateShort = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
};

// Format date only without weekday (e.g., "21 tháng 12 năm 2024")
export const formatDateOnly = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Format time (e.g., "14:00")
export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format date and time short (e.g., "14:00, 21/12/2024")
export const formatDateTime = (dateString: string) => {
  return `${formatTime(dateString)}, ${formatDateShort(dateString)}`;
};
