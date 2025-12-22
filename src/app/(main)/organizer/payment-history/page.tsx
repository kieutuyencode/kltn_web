"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components";
import { getMyPaymentOrganizer, getPaymentOrganizerStatus } from "~/api";
import {
  formatPrice,
  formatTime,
  formatDateShort,
  formatDateTime,
} from "~/utils";
import type { TPaymentOrganizer } from "~/types";
import { useAuthStore } from "~/stores";

const filterSchema = z.object({
  statusId: z.string().optional(),
});

type FilterFormDto = z.infer<typeof filterSchema>;

const getBlockchainExplorerUrl = (txhash: string) => {
  return `https://sepolia.etherscan.io/tx/${txhash}`;
};

const getStatusBadge = (status?: { name: string }) => {
  if (!status) return null;

  const statusName = status.name.toLowerCase();
  const isSuccess =
    statusName.includes("thành công") || statusName.includes("success");
  const isFailed =
    statusName.includes("thất bại") || statusName.includes("failed");

  return (
    <Badge
      variant="default"
      className={`flex items-center gap-1.5 w-fit ${
        isSuccess
          ? "bg-green-600 hover:bg-green-700"
          : isFailed
          ? "bg-red-600 hover:bg-red-700"
          : "bg-blue-600 hover:bg-blue-700"
      } text-white border-0`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : isFailed ? (
        <XCircle className="w-3.5 h-3.5" />
      ) : (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      )}
      {status.name}
    </Badge>
  );
};

export default function PaymentHistoryPage() {
  const authStore = useAuthStore();
  const isAuthenticated = !!authStore.userAccessToken;

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const form = useForm<FilterFormDto>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      statusId: undefined,
    },
  });

  // Get payment organizer statuses for filter
  const paymentStatusesQuery = useQuery({
    queryKey: getPaymentOrganizerStatus.queryKey(),
    queryFn: getPaymentOrganizerStatus,
    enabled: isAuthenticated,
  });

  const statusIdValue = form.watch("statusId");
  const statusId = React.useMemo(
    () =>
      statusIdValue && statusIdValue !== "all"
        ? Number(statusIdValue)
        : undefined,
    [statusIdValue]
  );

  const paymentsQuery = useQuery({
    queryKey: getMyPaymentOrganizer.queryKey({
      statusId,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    queryFn: () =>
      getMyPaymentOrganizer({
        statusId,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    enabled: isAuthenticated,
  });

  const payments: TPaymentOrganizer[] = React.useMemo(
    () => paymentsQuery.data?.data?.rows || [],
    [paymentsQuery.data?.data?.rows]
  );
  const isLoading = paymentsQuery.isLoading;

  const columns: ColumnDef<TPaymentOrganizer>[] = React.useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: "Thời gian yêu cầu",
        cell: ({ row }) => {
          return (
            <div className="text-sm">
              {formatDateTime(row.getValue("createdAt"))}
            </div>
          );
        },
      },
      {
        accessorKey: "event",
        header: "Sự kiện",
        cell: ({ row }) => {
          const event = row.original.event;
          if (!event) return "-";
          return (
            <Link
              href={`/events/${event.slug}`}
              className="font-medium hover:underline"
            >
              {event.name}
            </Link>
          );
        },
      },
      {
        accessorKey: "schedule",
        header: "Suất diễn",
        cell: ({ row }) => {
          const schedule = row.original.schedule;
          if (!schedule) return "-";
          return (
            <div className="text-sm">
              {formatTime(schedule.startDate)},{" "}
              {formatDateShort(schedule.startDate)}
            </div>
          );
        },
      },
      {
        accessorKey: "receiveAmount",
        header: () => <div className="text-left">Số tiền nhận được</div>,
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("receiveAmount") as string);
          return (
            <div className="text-left font-medium text-green-600">
              {formatPrice(amount)} EVT
            </div>
          );
        },
      },
      {
        accessorKey: "feeAmount",
        header: () => <div className="text-left">Phí dịch vụ</div>,
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("feeAmount") as string);
          return (
            <div className="text-left font-medium">
              {formatPrice(amount)} EVT
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const status = row.original.status;
          return getStatusBadge(status);
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const payment = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Mở menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {payment.event && (
                  <DropdownMenuItem asChild>
                    <Link href={`/events/${payment.event.slug}`}>
                      Xem sự kiện
                    </Link>
                  </DropdownMenuItem>
                )}
                {payment.eventId && payment.scheduleId && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/manage-events/${payment.eventId}/payment-history?scheduleId=${payment.scheduleId}`}
                    >
                      Xem chi tiết thanh toán
                    </Link>
                  </DropdownMenuItem>
                )}
                {payment.txhash && (
                  <DropdownMenuItem asChild>
                    <a
                      href={getBlockchainExplorerUrl(payment.txhash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Xem giao dịch
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: payments,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(
      (paymentsQuery.data?.data?.count || 0) / pagination.pageSize
    ),
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    state: {
      columnFilters,
      rowSelection,
      pagination,
    },
  });

  // Reset pagination to page 1 when filter changes
  const prevStatusIdRef = React.useRef(statusId);
  React.useEffect(() => {
    if (prevStatusIdRef.current !== statusId) {
      prevStatusIdRef.current = statusId;
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [statusId]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          Vui lòng đăng nhập để xem lịch sử thanh toán
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Lịch sử thanh toán</h1>
        <p className="text-muted-foreground">
          Xem lịch sử thanh toán cho tất cả suất diễn của bạn
        </p>
      </div>

      {/* Filter Section */}
      <div className="flex items-center gap-4 mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="w-full max-w-xs"
        >
          <Controller
            name="statusId"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value || "all"}
                onValueChange={(value) => {
                  field.onChange(value === "all" ? undefined : value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {paymentStatusesQuery.data?.data?.map((status) => (
                    <SelectItem key={status.id} value={status.id.toString()}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </form>
      </div>

      {/* Table */}
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
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Chưa có lịch sử thanh toán nào
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Lịch sử thanh toán của bạn sẽ hiển thị ở đây
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end px-2">
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Trang {table.getState().pagination.pageIndex + 1}/
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Trang trước</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Trang sau</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
