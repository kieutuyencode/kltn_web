"use client";

import * as React from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2, Ticket, QrCode, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Button,
} from "~/components";
import { getEventDetail, getCheckInStatistics, postRedeemTicket } from "~/api";
import { formatPrice } from "~/utils";
import type { TCheckInStatisticsDetail } from "~/types";

const redeemTicketSchema = z.object({
  encodedQrCode: z.string().trim().min(1, "Vui lòng nhập mã QR"),
});

type RedeemTicketFormDto = z.infer<typeof redeemTicketSchema>;

export default function CheckInPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const eventId = id as string;
  const scheduleId = searchParams.get("scheduleId");
  const queryClient = useQueryClient();

  const eventQuery = useQuery({
    queryKey: getEventDetail.queryKey(Number(eventId || 0)),
    queryFn: () => getEventDetail(Number(eventId || 0)),
    enabled: !!eventId,
  });

  const checkInStatisticsQuery = useQuery({
    queryKey: getCheckInStatistics.queryKey(Number(scheduleId || 0)),
    queryFn: () => getCheckInStatistics(Number(scheduleId || 0)),
    enabled: !!scheduleId,
  });

  const form = useForm<RedeemTicketFormDto>({
    resolver: zodResolver(redeemTicketSchema),
    defaultValues: {
      encodedQrCode: "",
    },
  });

  const redeemTicketMutation = useMutation({
    mutationFn: postRedeemTicket,
    onSuccess: (result) => {
      toast.success(result.message || "Xác thực vé thành công");
      form.reset();
      // Refresh statistics after successful check-in
      if (scheduleId) {
        queryClient.invalidateQueries({
          queryKey: getCheckInStatistics.queryKey(Number(scheduleId)),
        });
      }
    },
  });

  const event = eventQuery.data?.data;
  const statistics = checkInStatisticsQuery.data?.data;

  // Extract statistics data
  const overview = statistics?.overview || {
    totalCheckedIn: 0,
    totalSold: 0,
    checkInRate: 0,
  };
  const details = statistics?.details || [];

  const totalCheckedIn = overview.totalCheckedIn;
  const totalTicketsSold = overview.totalSold;
  const checkInPercentage = Math.round(overview.checkInRate * 100);

  const columns: ColumnDef<TCheckInStatisticsDetail>[] = React.useMemo(
    () => [
      {
        accessorKey: "ticketTypeName",
        header: "Loại vé",
        cell: ({ row }) => {
          return (
            <div className="font-medium">{row.getValue("ticketTypeName")}</div>
          );
        },
      },
      {
        accessorKey: "price",
        header: () => <div className="text-left">Giá bán</div>,
        cell: ({ row }) => {
          const price = parseFloat(row.getValue("price") as string);
          return (
            <div className="text-left font-medium">
              {formatPrice(price)} EVT
            </div>
          );
        },
      },
      {
        accessorKey: "checkedIn",
        header: () => <div className="text-left">Đã check-in</div>,
        cell: ({ row }) => {
          const checkedIn = row.getValue("checkedIn") as number;
          const sold = row.original.sold;
          return (
            <div className="text-left font-medium">
              {checkedIn}/{sold}
            </div>
          );
        },
      },
      {
        accessorKey: "checkInRate",
        header: () => <div className="text-left">Tỉ lệ check-in</div>,
        cell: ({ row }) => {
          const checkInRate = row.getValue("checkInRate") as number;
          const checkInRatio = Math.round(checkInRate * 100);
          return (
            <div className="text-left">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[200px]">
                  <div
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${checkInRatio}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium min-w-[40px]">
                  {checkInRatio}%
                </span>
              </div>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: details,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isLoading = checkInStatisticsQuery.isLoading;

  if (!eventId || !event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vui lòng chọn sự kiện</p>
      </div>
    );
  }

  if (!scheduleId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Check-in</h2>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Vui lòng chọn suất diễn để xem thống kê check-in
            </p>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = (data: RedeemTicketFormDto) => {
    redeemTicketMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Check-in</h2>
      </div>

      {/* QR Code Check-in Section */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Quét mã QR để check-in
        </h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Controller
                name="encodedQrCode"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    placeholder="Nhập hoặc dán mã QR code"
                    className={fieldState.invalid ? "border-destructive" : ""}
                    disabled={redeemTicketMutation.isPending}
                  />
                )}
              />
              {form.formState.errors.encodedQrCode && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.encodedQrCode.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={redeemTicketMutation.isPending}
              className="min-w-[120px]"
            >
              {redeemTicketMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Check-in
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Overview Section */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Tổng quan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Checked-in count */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Đã check-in</p>
            <p className="text-2xl font-bold">{totalCheckedIn} vé</p>
            <p className="text-sm text-muted-foreground mt-1">
              Đã bán {totalTicketsSold} vé
            </p>
          </div>

          {/* Center: Progress circle */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 56 * (1 - checkInPercentage / 100)
                  }`}
                  className="text-yellow-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {checkInPercentage} %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Chi tiết</h3>
        <p className="text-sm text-muted-foreground mb-4">Vé đã bán</p>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải...
                    </div>
                  </TableCell>
                </TableRow>
              ) : checkInStatisticsQuery.isError ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm font-medium text-destructive">
                        Có lỗi xảy ra khi tải dữ liệu thống kê
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Ticket className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        Chưa có loại vé nào
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Thống kê check-in sẽ hiển thị ở đây khi có vé được bán
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
