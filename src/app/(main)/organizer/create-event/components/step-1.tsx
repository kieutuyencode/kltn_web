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
  FieldGroup,
  Field,
  FieldLabel,
} from "~/components";

export const Step1 = () => {
  // State để lưu các giá trị của form
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
    <form onSubmit={handleSubmit} className="space-y-7">
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
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="event-name">Tên sự kiện</FieldLabel>
              <Input id="event-name" placeholder="Nhập tên sự kiện" />
            </Field>

            <Field>
              <FieldLabel>Loại địa điểm</FieldLabel>
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
            </Field>

            {eventType === "offline" && (
              <>
                <Field>
                  <FieldLabel>Địa chỉ sự kiện</FieldLabel>
                  <Input id="address" placeholder="Nhập địa chỉ sự kiện" />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                  <Field>
                    <FieldLabel htmlFor="province">Tỉnh/Thành phố</FieldLabel>
                    <Select defaultValue="">
                      <SelectTrigger id="province">
                        <SelectValue placeholder="Chọn tỉnh/thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hcm">
                          Thành phố Hồ Chí Minh
                        </SelectItem>
                        <SelectItem value="hn">Hà Nội</SelectItem>
                        <SelectItem value="dn">Đà Nẵng</SelectItem>
                        <SelectItem value="ct">Cần Thơ</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="district">Quận/Huyện</FieldLabel>
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
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="ward">Phường/Xã</FieldLabel>
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
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="street">Số nhà, đường</FieldLabel>
                    <Input id="street" placeholder="Nhập số nhà, tên đường" />
                  </Field>
                </div>
              </>
            )}

            {eventType === "online" && (
              <Field>
                <FieldLabel htmlFor="online-link">Link tham gia</FieldLabel>
                <Input
                  id="online-link"
                  type="url"
                  placeholder="https://example.com/meeting"
                />
              </Field>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Mô tả */}
      <Card>
        <CardHeader>
          <CardTitle>Mô tả sự kiện</CardTitle>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="description">Nội dung</FieldLabel>
            <Textarea
              id="description"
              placeholder="Giới thiệu sơ lược về sự kiện của bạn..."
              rows={8}
            />
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Đang xử lý..." : "Tạo sự kiện"}
      </Button>
    </form>
  );
};
