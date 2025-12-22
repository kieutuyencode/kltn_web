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
import { getMyPaymentTicket, getPaymentTicketStatus } from "~/api";
import { formatPrice, formatDateTime } from "~/utils";
import type { TPaymentTicket } from "~/types";
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

  // Get payment ticket statuses for filter
  const paymentStatusesQuery = useQuery({
    queryKey: getPaymentTicketStatus.queryKey(),
    queryFn: getPaymentTicketStatus,
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

  const paymentTicketsQuery = useQuery({
    queryKey: getMyPaymentTicket.queryKey({
      statusId,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    queryFn: () =>
      getMyPaymentTicket({
        statusId,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    enabled: isAuthenticated,
  });

  const paymentTickets: TPaymentTicket[] = React.useMemo(
    () => paymentTicketsQuery.data?.data?.rows || [],
    [paymentTicketsQuery.data?.data?.rows]
  );
  const isLoading = paymentTicketsQuery.isLoading;

  const columns: ColumnDef<TPaymentTicket>[] = React.useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: "Thời gian thanh toán",
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
        accessorKey: "ticketType",
        header: "Loại vé",
        cell: ({ row }) => {
          const ticketType = row.original.ticketType;
          if (!ticketType) return "-";
          return (
            <div>
              <div className="font-medium">{ticketType.name}</div>
              {ticketType.description && (
                <div className="text-sm text-muted-foreground">
                  {ticketType.description}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "ticketQuantity",
        header: () => <div className="text-left">Số lượng</div>,
        cell: ({ row }) => {
          return (
            <div className="text-left font-medium">
              {row.getValue("ticketQuantity")} vé
            </div>
          );
        },
      },
      {
        accessorKey: "tokenAmount",
        header: () => <div className="text-left">Tổng tiền</div>,
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("tokenAmount") as string);
          return (
            <div className="text-left font-medium text-primary">
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
          const paymentTicket = row.original;

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
                {paymentTicket.event && (
                  <DropdownMenuItem asChild>
                    <Link href={`/events/${paymentTicket.event.slug}`}>
                      Xem sự kiện
                    </Link>
                  </DropdownMenuItem>
                )}
                {paymentTicket.paymentTxhash && (
                  <DropdownMenuItem asChild>
                    <a
                      href={getBlockchainExplorerUrl(
                        paymentTicket.paymentTxhash
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Xem giao dịch thanh toán
                    </a>
                  </DropdownMenuItem>
                )}
                {paymentTicket.mintTxhash && (
                  <DropdownMenuItem asChild>
                    <a
                      href={getBlockchainExplorerUrl(paymentTicket.mintTxhash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Xem giao dịch mint vé
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
    data: paymentTickets,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(
      (paymentTicketsQuery.data?.data?.count || 0) / pagination.pageSize
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
          Vui lòng đăng nhập để xem lịch sử thanh toán vé
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Lịch sử thanh toán vé</h1>
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
                      Chưa có giao dịch thanh toán nào
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Lịch sử thanh toán vé của bạn sẽ hiển thị ở đây
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
