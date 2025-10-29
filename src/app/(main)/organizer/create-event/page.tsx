import {
  Progress,
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  AspectRatio,
} from "~/components";
import Image from "next/image";

const steps = [
  "Thông tin sự kiện",
  "Thời gian & Loại vé",
  "Cài đặt",
  "Thông tin thanh toán",
];
const currentStep = 1;

export default function Page() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (bỏ qua trong ví dụ này để tập trung vào nội dung) */}

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Tạo sự kiện</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">Lưu</Button>
            <Button>Tiếp tục</Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress
            value={(currentStep / steps.length) * 100}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            {steps.map((step, index) => (
              <span
                key={step}
                className={
                  index + 1 === currentStep ? "font-bold text-red-600" : ""
                }
              >
                {index + 1}. {step}
              </span>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Upload Ảnh */}
          <Card>
            <CardHeader>
              <CardTitle>Upload hình ảnh</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Label htmlFor="picture" className="cursor-pointer">
                  <p>Xem vị trí hiển thị các ảnh</p>
                  <Input id="picture" type="file" className="hidden" />
                  {/* Hiển thị ảnh đã upload ở đây */}
                </Label>
              </div>
              <AspectRatio
                ratio={16 / 9}
                className="bg-muted rounded-lg overflow-hidden"
              >
                <Image
                  src="/placeholder.svg"
                  alt="Event poster"
                  layout="fill"
                  className="object-cover"
                />
              </AspectRatio>
            </CardContent>
          </Card>

          {/* Thông tin chi tiết */}
          <Card>
            <CardHeader>
              <CardTitle>Tên sự kiện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Tên sự kiện" />

              <div>
                <Label>Địa chỉ sự kiện</Label>
                <RadioGroup defaultValue="offline" className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="offline" id="offline" />
                    <Label htmlFor="offline">Sự kiện Offline</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online">Sự kiện Online</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Tỉnh/Thành" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hcm">Thành Phố Hồ Chí Minh</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Quận/Huyện" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bt">Quận Bình Thạnh</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Phường/Xã" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p26">Phường 26</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Số nhà, đường" />
              </div>
            </CardContent>
          </Card>

          {/* Mô tả */}
          <Card>
            <CardHeader>
              <CardTitle>Mô tả sự kiện</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Giới thiệu sơ lược về sự kiện..."
                rows={10}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
