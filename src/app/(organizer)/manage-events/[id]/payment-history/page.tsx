"use client";

import React from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAppKitAccount,
  useAppKit,
  useAppKitProvider,
} from "@reown/appkit/react";
import { BrowserProvider, Contract, Eip1193Provider } from "ethers";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getEventDetail,
  getMySchedule,
  getMyPaymentOrganizerBySchedule,
  postRequestSchedulePayout,
  getClientConfig,
} from "~/api";
import { formatPrice, formatDateTime, fromUnits } from "~/utils";
import { Button, Alert, AlertTitle, AlertDescription } from "~/components";
import {
  History,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Clock,
  XCircle,
} from "lucide-react";
import { useAuthStore } from "~/stores";
import {
  EVENT_CONTRACT_ADDRESS,
  EVENT_CONTRACT_ABI,
} from "~/constants/blockchain.constant";
import Decimal from "decimal.js";

const getBlockchainExplorerUrl = (txhash: string) => {
  return `https://sepolia.etherscan.io/tx/${txhash}`;
};

const getAddressExplorerUrl = (address: string) => {
  return `https://sepolia.etherscan.io/address/${address}`;
};

export default function PaymentHistoryPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const authStore = useAuthStore();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const eventId = id as string;
  const scheduleId = searchParams.get("scheduleId");

  const [balanceInfo, setBalanceInfo] = useState<{
    totalAmount: string;
    feeAmount: string;
    receiveAmount: string;
    contractOrganizerAddress: string | null;
  } | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const eventQuery = useQuery({
    queryKey: getEventDetail.queryKey(Number(eventId || 0)),
    queryFn: () => getEventDetail(Number(eventId || 0)),
    enabled: !!eventId,
  });

  const schedulesQuery = useQuery({
    queryKey: getMySchedule.queryKey(Number(eventId || 0)),
    queryFn: () => getMySchedule(Number(eventId || 0)),
    enabled: !!eventId,
  });

  const paymentQuery = useQuery({
    queryKey: getMyPaymentOrganizerBySchedule.queryKey(Number(scheduleId || 0)),
    queryFn: () => getMyPaymentOrganizerBySchedule(Number(scheduleId || 0)),
    enabled: !!scheduleId && !!authStore.userAccessToken,
  });

  const configQuery = useQuery({
    queryKey: getClientConfig.queryKey(),
    queryFn: getClientConfig,
  });

  const requestPayoutMutation = useMutation({
    mutationFn: postRequestSchedulePayout,
    onSuccess: () => {
      toast.success("Yêu cầu thanh toán thành công");
      queryClient.invalidateQueries({
        queryKey: getMyPaymentOrganizerBySchedule.queryKey(
          Number(scheduleId || 0)
        ),
      });
      setBalanceInfo(null);
    },
  });

  const event = eventQuery.data?.data;
  const schedules = schedulesQuery.data?.data || [];
  const selectedSchedule = schedules.find((s) => s.id === Number(scheduleId));
  const payment = paymentQuery.data?.data;
  const feeRate = configQuery.data?.data?.SELL_TICKET_FEE_RATE;

  // Load balance info from contract
  useEffect(() => {
    const loadBalanceInfo = async () => {
      if (!selectedSchedule || !scheduleId || payment || !feeRate) {
        setBalanceInfo(null);
        return;
      }

      setIsLoadingBalance(true);
      try {
        const provider = new BrowserProvider(walletProvider as Eip1193Provider);
        const eventContract = new Contract(
          EVENT_CONTRACT_ADDRESS,
          EVENT_CONTRACT_ABI,
          provider
        );

        const [scheduleBalance, contractOrganizerAddress] = await Promise.all([
          eventContract.getScheduleBalance(Number(scheduleId)),
          eventContract
            .getOrganizerSchedule(Number(scheduleId))
            .catch(() => null),
        ]);

        const totalAmount = fromUnits(scheduleBalance);
        const feeAmount = totalAmount.mul(new Decimal(feeRate));
        const receiveAmount = totalAmount.sub(feeAmount);

        setBalanceInfo({
          totalAmount: totalAmount.toString(),
          feeAmount: feeAmount.toString(),
          receiveAmount: receiveAmount.toString(),
          contractOrganizerAddress: contractOrganizerAddress || null,
        });
      } catch (error) {
        console.error("Error loading balance info:", error);
        setBalanceInfo(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    loadBalanceInfo();
  }, [selectedSchedule, scheduleId, payment, feeRate, walletProvider]);

  const handleRequestPayout = () => {
    if (!isConnected || !address) {
      toast.error("Vui lòng kết nối ví");
      open();
      return;
    }

    if (!scheduleId) {
      toast.error("Vui lòng chọn suất diễn");
      return;
    }

    if (!authStore.walletAccessToken) {
      toast.error("Vui lòng kết nối ví");
      open();
      return;
    }

    requestPayoutMutation.mutate({
      scheduleId: Number(scheduleId),
    });
  };

  const isEnded = selectedSchedule
    ? new Date(selectedSchedule.endDate) < new Date()
    : false;

  // Kiểm tra các điều kiện để yêu cầu thanh toán
  const conditions = {
    hasSchedule: !!selectedSchedule,
    noPayment: !payment,
    hasBalanceInfo: !!balanceInfo,
    scheduleEnded: isEnded,
    walletConnected: isConnected && !!address,
    hasWalletToken: !!authStore.walletAccessToken,
    walletMatches:
      balanceInfo &&
      address &&
      selectedSchedule?.organizerAddress.toLowerCase() ===
        address.toLowerCase(),
    hasRevenue: balanceInfo && Number(balanceInfo.receiveAmount) > 0,
  };

  const canRequestPayout =
    conditions.hasSchedule &&
    conditions.noPayment &&
    conditions.hasBalanceInfo &&
    conditions.scheduleEnded &&
    conditions.walletConnected &&
    conditions.hasWalletToken &&
    conditions.walletMatches &&
    conditions.hasRevenue;

  // Lấy danh sách các điều kiện chưa đáp ứng (chỉ khi schedule đã kết thúc)
  const getUnmetConditions = () => {
    if (!conditions.scheduleEnded || !conditions.hasBalanceInfo) {
      return [];
    }

    const unmet: Array<{ icon: React.ReactNode; message: string }> = [];

    if (!conditions.walletConnected) {
      unmet.push({
        icon: <Wallet className="w-4 h-4" />,
        message: "Chưa kết nối ví. Vui lòng kết nối ví để yêu cầu thanh toán.",
      });
    }

    if (conditions.walletConnected && !conditions.hasWalletToken) {
      unmet.push({
        icon: <Wallet className="w-4 h-4" />,
        message:
          "Ví chưa được xác thực. Vui lòng ký thông điệp để xác thực ví.",
      });
    }

    if (
      conditions.walletConnected &&
      conditions.hasWalletToken &&
      balanceInfo &&
      address &&
      selectedSchedule?.organizerAddress &&
      selectedSchedule.organizerAddress.toLowerCase() !== address.toLowerCase()
    ) {
      const connectedAddress = address.slice(0, 6) + "..." + address.slice(-4);
      const organizerAddress =
        selectedSchedule.organizerAddress.slice(0, 6) +
        "..." +
        selectedSchedule.organizerAddress.slice(-4);

      // Kiểm tra nếu contractOrganizerAddress khác với organizerAddress
      const contractAddressMismatch =
        balanceInfo.contractOrganizerAddress !== null &&
        balanceInfo.contractOrganizerAddress.toLowerCase() !==
          selectedSchedule.organizerAddress.toLowerCase();

      if (contractAddressMismatch && balanceInfo.contractOrganizerAddress) {
        const contractAddress =
          balanceInfo.contractOrganizerAddress.slice(0, 6) +
          "..." +
          balanceInfo.contractOrganizerAddress.slice(-4);
        unmet.push({
          icon: <AlertCircle className="w-4 h-4" />,
          message: `Hệ thống đang cập nhật ví tổ chức suất diễn. Ví trong contract (${contractAddress}) chưa khớp với ví trong hệ thống (${organizerAddress}). Vui lòng đợi hệ thống cập nhật.`,
        });
      } else {
        unmet.push({
          icon: <AlertCircle className="w-4 h-4" />,
          message: `Ví đang kết nối (${connectedAddress}) không khớp với ví tổ chức suất diễn (${organizerAddress}). Vui lòng kết nối đúng ví.`,
        });
      }
    }

    if (!conditions.hasRevenue && conditions.hasBalanceInfo) {
      unmet.push({
        icon: <XCircle className="w-4 h-4" />,
        message:
          "Chưa bán được vé nên không có tiền để thanh toán. Số tiền nhận được sau khi trừ phí phải lớn hơn 0.",
      });
    }

    return unmet;
  };

  if (!eventId || !event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vui lòng chọn sự kiện</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Lịch sử thanh toán</h2>
        <p className="text-muted-foreground">
          Yêu cầu thanh toán tiền bán vé sau khi suất diễn kết thúc
        </p>
      </div>

      {selectedSchedule && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Suất diễn</h3>
              <p className="text-muted-foreground">
                {formatDateTime(selectedSchedule.startDate)}
              </p>
            </div>
          </div>

          {paymentQuery.isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
            </div>
          ) : payment ? (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Số tiền nhận được
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(Number(payment.receiveAmount))} EVT
                  </p>
                </div>
                <div>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded text-sm">
                    {payment.status?.name || "Đang xử lý"}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí dịch vụ:</span>
                  <span>{formatPrice(Number(payment.feeAmount))} EVT</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Địa chỉ ví:</span>
                  <a
                    href={getAddressExplorerUrl(payment.organizerAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs hover:underline flex items-center gap-1"
                  >
                    {payment.organizerAddress.slice(0, 6)}...
                    {payment.organizerAddress.slice(-4)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {payment.txhash && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">
                      Transaction hash:
                    </span>
                    <a
                      href={getBlockchainExplorerUrl(payment.txhash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs hover:underline flex items-center gap-1"
                    >
                      {payment.txhash.slice(0, 10)}...
                      {payment.txhash.slice(-8)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ngày tạo:</span>
                  <span>{formatDateTime(payment.createdAt)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hiển thị thông tin balance */}
              {isLoadingBalance ? (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : balanceInfo ? (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tổng số tiền đã bán được
                      </p>
                      <p className="text-xl font-bold text-primary">
                        {formatPrice(Number(balanceInfo.totalAmount))} EVT
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Phí dịch vụ:
                      </span>
                      <span>
                        {formatPrice(Number(balanceInfo.feeAmount))} EVT
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Số tiền nhận được:
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(Number(balanceInfo.receiveAmount))} EVT
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Thông báo điều kiện */}
              {!canRequestPayout && selectedSchedule && (
                <div className="space-y-2">
                  {!isEnded ? (
                    <Alert>
                      <Clock className="w-4 h-4" />
                      <AlertTitle>Suất diễn chưa kết thúc</AlertTitle>
                      <AlertDescription>
                        Vui lòng đợi đến khi suất diễn kết thúc (
                        {selectedSchedule.endDate &&
                          formatDateTime(selectedSchedule.endDate)}
                        ) để có thể yêu cầu thanh toán.
                      </AlertDescription>
                    </Alert>
                  ) : balanceInfo ? (
                    getUnmetConditions().length > 0 ? (
                      <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertTitle>Chưa thể yêu cầu thanh toán</AlertTitle>
                        <AlertDescription>
                          <div className="space-y-2 mt-2">
                            <p className="font-medium">
                              Các điều kiện cần đáp ứng:
                            </p>
                            <ul className="space-y-1.5 list-none">
                              {getUnmetConditions().map((condition, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  {condition.icon}
                                  <span>{condition.message}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : null
                  ) : null}
                </div>
              )}

              {/* Nút yêu cầu thanh toán */}
              <div className="flex items-center justify-between">
                {canRequestPayout && (
                  <div className="w-full space-y-2">
                    <Alert>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <AlertTitle className="text-green-600">
                        Đã đủ điều kiện yêu cầu thanh toán
                      </AlertTitle>
                      <AlertDescription>
                        Bạn có thể yêu cầu thanh toán số tiền{" "}
                        {balanceInfo &&
                          formatPrice(Number(balanceInfo.receiveAmount))}{" "}
                        EVT sau khi trừ phí dịch vụ.
                      </AlertDescription>
                    </Alert>
                    <Button
                      className="bg-primary hover:bg-primary/90 w-full"
                      onClick={handleRequestPayout}
                      disabled={requestPayoutMutation.isPending}
                    >
                      {requestPayoutMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        "Yêu cầu thanh toán"
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {!balanceInfo && !isLoadingBalance && (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có lịch sử thanh toán</p>
                  {!isEnded && (
                    <p className="text-xs mt-2">
                      Suất diễn chưa kết thúc, vui lòng đợi đến khi suất diễn
                      kết thúc
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!selectedSchedule && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Vui lòng chọn suất diễn</p>
        </div>
      )}
    </div>
  );
}
