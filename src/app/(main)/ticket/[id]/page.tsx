"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider, Contract, Eip1193Provider } from "ethers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  CheckCircle2,
  XCircle,
  QrCode,
  ArrowLeft,
  Send,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components";
import {
  getMyTicketDetail,
  getTicketQrCode,
  getMyTicket,
  postTransferTicket,
} from "~/api";
import { getResourceClientUrl } from "~/utils";
import { useAuthStore } from "~/stores";
import {
  EVENT_CONTRACT_ADDRESS,
  EVENT_CONTRACT_ABI,
} from "~/constants/blockchain.constant";

const transferSchema = z.object({
  toAddress: z.string().min(1, "Vui lòng nhập địa chỉ ví"),
  email: z.string().email("Vui lòng nhập email hợp lệ"),
});

type TransferFormDto = z.infer<typeof transferSchema>;

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const authStore = useAuthStore();
  const ticketId = Number(params.id);
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const [showQrCode, setShowQrCode] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [copied, setCopied] = useState(false);

  const form = useForm<TransferFormDto>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      toAddress: "",
      email: "",
    },
  });

  const ticketQuery = useQuery({
    queryKey: getMyTicketDetail.queryKey(ticketId),
    queryFn: () => getMyTicketDetail(ticketId),
    enabled: !!authStore.userAccessToken && !!ticketId,
  });

  const qrCodeQuery = useQuery({
    queryKey: ["ticket", ticketId, "qr-code"],
    queryFn: () => getTicketQrCode(ticketId),
    enabled: showQrCode && !!authStore.walletAccessToken && !!ticketId,
    refetchOnMount: true,
  });

  const ticket = ticketQuery.data?.data;
  const event = ticket?.event;
  const schedule = ticket?.schedule;
  const ticketType = ticket?.ticketType;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = formatDate(dateString);
    const time = formatTime(dateString);
    return `${time}, ${date}`;
  };

  const isSameDay = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return "/logo.png";
    if (imagePath.startsWith("http")) return imagePath;
    return getResourceClientUrl(imagePath);
  };

  const handleShowQrCode = () => {
    if (!authStore.walletAccessToken) {
      toast.error("Vui lòng kết nối ví để xem mã QR");
      return;
    }
    // Invalidate query để fetch mã mới mỗi lần mở
    queryClient.invalidateQueries({
      queryKey: ["ticket", ticketId, "qr-code"],
    });
    setShowQrCode(true);
  };

  const handleTransferTicket = async (data: TransferFormDto) => {
    if (!isConnected || !address) {
      toast.error("Vui lòng kết nối ví trước");
      return;
    }

    if (!ticket) {
      toast.error("Không tìm thấy thông tin vé");
      return;
    }

    setIsTransferring(true);

    try {
      const provider = new BrowserProvider(walletProvider as Eip1193Provider);
      const signer = await provider.getSigner();

      const eventContract = new Contract(
        EVENT_CONTRACT_ADDRESS,
        EVENT_CONTRACT_ABI,
        signer
      );

      const tx = await eventContract.transferTicket(
        ticket._ticketId,
        data.toAddress
      );

      toast.success("Giao dịch đã được gửi, đang chờ xác nhận...");
      const receipt = await tx.wait();

      if (receipt) {
        const txHash = tx.hash || receipt?.hash;

        if (txHash) {
          try {
            // Gọi API để cập nhật lại chủ vé trên database
            await postTransferTicket({
              ticketId: ticket.id,
              email: data.email,
              txhash: txHash,
            });

            toast.success("Chuyển giao vé thành công!");
            setShowTransferDialog(false);
            form.reset();

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({
              queryKey: getMyTicketDetail.queryKey(ticketId),
            });
            queryClient.invalidateQueries({
              queryKey: getMyTicket.queryKey(),
            });

            // Quay về trang danh sách vé
            router.push("/ticket");
          } catch (apiError: any) {
            console.error("Error calling transfer ticket API:", apiError);
            toast.error(
              apiError?.response?.data?.message ||
                "Chuyển vé trên blockchain thành công nhưng có lỗi khi cập nhật database"
            );
          }
        } else {
          toast.error("Không thể lấy transaction hash");
        }
      }
    } catch (error: any) {
      console.error("Error transferring ticket:", error);
      const errorMessage =
        error?.reason || error?.message || "Có lỗi xảy ra khi chuyển giao vé";
      toast.error(errorMessage);
    } finally {
      setIsTransferring(false);
    }
  };

  if (!authStore.userAccessToken) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          Vui lòng đăng nhập để xem chi tiết vé
        </p>
      </div>
    );
  }

  if (ticketQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (ticketQuery.isError || !ticket || !event || !schedule || !ticketType) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">
          Không tìm thấy vé hoặc có lỗi xảy ra
        </p>
        <Button onClick={() => router.push("/ticket")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách vé
        </Button>
      </div>
    );
  }

  const endDate = new Date(schedule.endDate);
  const isPast = endDate < new Date();

  // Kiểm tra ví kết nối có trùng với ví sở hữu vé không
  const isWalletMatched =
    address &&
    ticket.walletAddress &&
    address.toLowerCase() === ticket.walletAddress.toLowerCase();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button
        onClick={() => router.push("/ticket")}
        variant="ghost"
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại danh sách vé
      </Button>

      <div className="space-y-6">
        {/* Event Image and Basic Info */}
        <Card className="overflow-hidden">
          <div className="relative w-full h-64 md:h-96 bg-muted">
            <Image
              src={getImageUrl(event.image)}
              alt={event.name}
              fill
              className="object-cover"
            />
          </div>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Link
                  href={`/events/${event.slug}`}
                  className="hover:underline"
                >
                  <CardTitle className="text-2xl md:text-3xl mb-2">
                    {event.name}
                  </CardTitle>
                </Link>
                {event.category && (
                  <Badge variant="outline" className="mb-4">
                    {event.category.name}
                  </Badge>
                )}
              </div>
              <Badge
                variant={
                  ticket.isRedeemed
                    ? "default"
                    : isPast
                    ? "destructive"
                    : "default"
                }
                className={`flex items-center gap-1.5 shrink-0 ${
                  ticket.isRedeemed
                    ? "bg-green-600 hover:bg-green-700"
                    : isPast
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white border-0 shadow-md`}
              >
                {ticket.isRedeemed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã sử dụng
                  </>
                ) : isPast ? (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    Đã hết hạn
                  </>
                ) : (
                  <>
                    <Ticket className="w-3.5 h-3.5" />
                    Chưa sử dụng
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Ticket Details */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin vé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Ticket className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Loại vé</p>
                <p className="font-medium text-foreground">{ticketType.name}</p>
                {ticketType.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {ticketType.description}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {isSameDay(schedule.startDate, schedule.endDate) ? (
              <>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Ngày diễn ra
                    </p>
                    <p className="font-medium text-foreground">
                      {formatDate(schedule.startDate)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Thời gian</p>
                    <p className="font-medium text-foreground">
                      {formatTime(schedule.startDate)} -{" "}
                      {formatTime(schedule.endDate)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Ngày bắt đầu
                    </p>
                    <p className="font-medium text-foreground">
                      {formatDate(schedule.startDate)} lúc{" "}
                      {formatTime(schedule.startDate)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Ngày kết thúc
                    </p>
                    <p className="font-medium text-foreground">
                      {formatDate(schedule.endDate)} lúc{" "}
                      {formatTime(schedule.endDate)}
                    </p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Địa điểm</p>
                <p className="font-medium text-foreground">{event.address}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Mua lúc</p>
                <p className="font-medium text-foreground">
                  {formatDateTime(ticket.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {!ticket.isRedeemed && !isPast && (
          <Card>
            <CardHeader>
              <CardTitle>Thao tác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isWalletMatched && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Vui lòng kết nối ví sở hữu vé ({ticket.walletAddress}) để
                    thực hiện các thao tác
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleShowQrCode}
                  variant="outline"
                  className="flex-1"
                  disabled={!authStore.walletAccessToken || !isWalletMatched}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Xem mã QR
                </Button>
                <Button
                  onClick={() => setShowTransferDialog(true)}
                  variant="outline"
                  className="flex-1"
                  disabled={!isConnected || !isWalletMatched}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Chuyển giao vé
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQrCode} onOpenChange={setShowQrCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mã QR vé</DialogTitle>
            <DialogDescription>
              Mã QR này sẽ được tạo mới mỗi lần bạn mở
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {qrCodeQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : qrCodeQuery.isError ? (
              <div className="text-center py-12">
                <p className="text-destructive">
                  Không thể tải mã QR. Vui lòng thử lại.
                </p>
              </div>
            ) : qrCodeQuery.data?.data ? (
              <div className="flex flex-col items-center gap-6">
                <div className="p-4 bg-white rounded-lg border">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      qrCodeQuery.data.data
                    )}`}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="w-48 h-48"
                    unoptimized
                  />
                </div>
                <div className="w-full">
                  <div className="flex gap-2">
                    <Input
                      value={qrCodeQuery.data.data}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            qrCodeQuery.data.data
                          );
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                          toast.success("Đã copy mã QR");
                        } catch {
                          toast.error("Không thể copy mã QR");
                        }
                      }}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chuyển giao vé</DialogTitle>
            <DialogDescription>
              Nhập địa chỉ ví và email của người nhận để chuyển giao vé này
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(handleTransferTicket)}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium mb-2 block">
                Địa chỉ ví người nhận
              </label>
              <Controller
                name="toAddress"
                control={form.control}
                render={({ field }) => (
                  <Input {...field} placeholder="0x..." className="font-mono" />
                )}
              />
              {form.formState.errors.toAddress && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.toAddress.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Email người nhận
              </label>
              <Controller
                name="email"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    placeholder="email@example.com"
                  />
                )}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowTransferDialog(false);
                  form.reset();
                }}
                disabled={isTransferring}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isTransferring}>
                {isTransferring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Chuyển giao
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
