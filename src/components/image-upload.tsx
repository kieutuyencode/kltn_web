"use client";

import { Upload, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface ImageUploadProps {
  // Callback để truyền đối tượng File ra ngoài khi có file mới
  onFileChange: (file: File | null) => void;
  // Prop mới: nhận URL ảnh có sẵn từ API
  initialImage?: string | null;
  className?: string;
}

export const ImageUpload = ({
  onFileChange,
  initialImage = null,
  className = "",
}: ImageUploadProps) => {
  // State để lưu trữ URL preview (có thể là base64 từ file local hoặc URL từ API)
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect để cập nhật preview khi initialImage từ props thay đổi
  useEffect(() => {
    // Chỉ cập nhật nếu giá trị mới khác với giá trị hiện tại
    if (initialImage !== imagePreview) {
      setImagePreview(initialImage);
    }
  }, [initialImage]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      // Gửi đối tượng File ra component cha
      onFileChange(file);

      // Tạo URL preview cho file mới chọn
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      console.warn("File không hợp lệ.");
      onFileChange(null);
      setImagePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImagePreview(null);
    // Thông báo cho component cha rằng ảnh đã bị xóa (bằng cách gửi null)
    onFileChange(null);

    // Reset input file nếu nó đã từng được dùng để chọn file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <label
      htmlFor="picture-upload"
      className={`relative block w-full aspect-video rounded-lg border-2 border-dashed text-center cursor-pointer transition-colors duration-200 overflow-hidden
        ${
          dragActive
            ? "border-red-400 bg-red-50"
            : "border-gray-300 hover:border-red-400"
        }
        ${imagePreview ? "border-solid" : ""}
        ${className}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        id="picture-upload"
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      {imagePreview ? (
        <>
          <img
            src={imagePreview}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-opacity"
            aria-label="Xóa ảnh"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <Upload className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-1">
            Nhấp để tải lên hoặc kéo thả ảnh vào đây
          </p>
        </div>
      )}
    </label>
  );
};
