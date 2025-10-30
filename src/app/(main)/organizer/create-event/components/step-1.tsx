import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  ImageUpload,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components";

export const Step1 = () => {
  // State để lưu các giá trị của form
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [eventImageFile, setEventImageFile] = useState<File | null>(null); // State để lưu File
  const [isLoading, setIsLoading] = useState(false);
  const [eventType, setEventType] = useState("offline");

  // Callback để nhận File từ ImageUpload
  const handleFileChange = (file: File | null) => {
    setEventImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventImageFile) {
      alert("Vui lòng chọn hình ảnh cho sự kiện!");
      return;
    }

    setIsLoading(true);

    // 1. Tạo FormData
    const formData = new FormData();

    // 2. Đính kèm file và các dữ liệu khác
    // 'eventImage' là key mà backend sẽ dùng để nhận file
    formData.append("eventImage", eventImageFile);
    formData.append("eventName", eventName);
    formData.append("description", description);
    // Thêm các trường khác nếu cần...
    // formData.append("eventType", eventType);

    try {
      // 3. Gửi request lên server
      const response = await fetch("/api/events", {
        // Thay bằng endpoint API của bạn
        method: "POST",
        body: formData,
        // Lưu ý: KHÔNG cần set header 'Content-Type'.
        // Trình duyệt sẽ tự động set 'Content-Type: multipart/form-data' và boundary cần thiết.
      });

      if (!response.ok) {
        throw new Error("Upload thất bại");
      }

      const result = await response.json();
      console.log("Upload thành công:", result);
      alert("Sự kiện đã được tạo thành công!");
      // Reset form hoặc chuyển trang tại đây
    } catch (error) {
      console.error("Lỗi khi upload:", error);
      alert("Đã có lỗi xảy ra khi tạo sự kiện.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Upload Ảnh */}
      <Card>
        <CardHeader>
          <CardTitle>Hình ảnh sự kiện</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload className="h-96" onFileChange={handleFileChange} />
        </CardContent>
      </Card>

      {/* Thông tin chi tiết */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin sự kiện</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="event-name">Tên sự kiện</Label>
            <Input id="event-name" placeholder="Nhập tên sự kiện" />
          </div>

          <div>
            <Label>Loại địa điểm</Label>
            <RadioGroup
              defaultValue="offline"
              value={eventType}
              onValueChange={setEventType}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="offline" id="offline" />
                <Label
                  htmlFor="offline"
                  className="mb-0 font-normal cursor-pointer"
                >
                  Sự kiện Offline
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="online" />
                <Label
                  htmlFor="online"
                  className="mb-0 font-normal cursor-pointer"
                >
                  Sự kiện Online
                </Label>
              </div>
            </RadioGroup>
          </div>

          {eventType === "offline" && (
            <>
              <div>
                <Label>Địa chỉ sự kiện</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">Tỉnh/Thành phố</Label>
                  <Select defaultValue="">
                    <SelectTrigger id="province">
                      <SelectValue placeholder="Chọn tỉnh/thành phố" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hcm">Thành phố Hồ Chí Minh</SelectItem>
                      <SelectItem value="hn">Hà Nội</SelectItem>
                      <SelectItem value="dn">Đà Nẵng</SelectItem>
                      <SelectItem value="ct">Cần Thơ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="district">Quận/Huyện</Label>
                  <Select defaultValue="">
                    <SelectTrigger id="district">
                      <SelectValue placeholder="Chọn quận/huyện" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bt">Quận Bình Thạnh</SelectItem>
                      <SelectItem value="q1">Quận 1</SelectItem>
                      <SelectItem value="q3">Quận 3</SelectItem>
                      <SelectItem value="pn">Quận Phú Nhuận</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ward">Phường/Xã</Label>
                  <Select defaultValue="">
                    <SelectTrigger id="ward">
                      <SelectValue placeholder="Chọn phường/xã" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="p1">Phường 1</SelectItem>
                      <SelectItem value="p2">Phường 2</SelectItem>
                      <SelectItem value="p26">Phường 26</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="street">Số nhà, đường</Label>
                  <Input id="street" placeholder="Nhập số nhà, tên đường" />
                </div>
              </div>
            </>
          )}

          {eventType === "online" && (
            <div>
              <Label htmlFor="online-link">Link tham gia</Label>
              <Input
                id="online-link"
                type="url"
                placeholder="https://example.com/meeting"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mô tả */}
      <Card>
        <CardHeader>
          <CardTitle>Mô tả sự kiện</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="description">Nội dung</Label>
          <Textarea
            id="description"
            placeholder="Giới thiệu sơ lược về sự kiện của bạn..."
            rows={8}
          />
        </CardContent>
      </Card>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Đang xử lý..." : "Tạo sự kiện"}
      </Button>
    </form>
  );
};
