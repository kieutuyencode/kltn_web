"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
  Field,
  FieldLabel,
  FieldGroup,
  FieldError,
} from "~/components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Pencil, PlusCircle, Ticket, Trash2 } from "lucide-react";
import {
  postCreateSchedule,
  putUpdateSchedule,
  deleteSchedule,
  getMySchedule,
  postCreateTicketType,
  putUpdateTicketType,
  deleteTicketType,
  getMyTicketType,
} from "~/api";
import type { TEventSchedule } from "~/types";

interface Step2Props {
  eventId?: number;
}

// --- Helper function to convert date to local datetime string for datetime-local input ---
const toLocalDateTimeString = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// --- Zod Schemas ---
const ticketFormSchema = z
  .object({
    id: z.number().optional(),
    name: z.string().min(1, "Tên loại vé không được để trống."),
    description: z.string().optional(),
    price: z
      .string()
      .min(1, "Giá vé không được để trống.")
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
        message: "Giá vé phải là số hợp lệ và lớn hơn hoặc bằng 0.",
      }),
    originalQuantity: z
      .string()
      .min(1, "Số lượng không được để trống.")
      .refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
        message: "Số lượng phải là số nguyên dương.",
      }),
    saleStartDate: z.string().min(1, "Ngày bắt đầu bán không được để trống."),
    saleEndDate: z.string().min(1, "Ngày kết thúc bán không được để trống."),
  })
  .refine(
    (data) => {
      if (!data.saleStartDate || !data.saleEndDate) return true;
      return new Date(data.saleStartDate) < new Date(data.saleEndDate);
    },
    {
      message: "Ngày kết thúc bán phải sau ngày bắt đầu bán.",
      path: ["saleEndDate"],
    }
  );

const sessionFormSchema = z
  .object({
    id: z.number().optional(),
    startDate: z.string().min(1, "Thời gian bắt đầu không được để trống."),
    endDate: z.string().min(1, "Thời gian kết thúc không được để trống."),
    organizerAddress: z
      .string()
      .min(1, "Địa chỉ tổ chức không được để trống.")
      .max(200, "Địa chỉ tổ chức không được vượt quá 200 ký tự."),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.startDate) < new Date(data.endDate);
    },
    {
      message: "Thời gian kết thúc phải sau thời gian bắt đầu.",
      path: ["endDate"],
    }
  );

type SessionFormData = z.infer<typeof sessionFormSchema>;
type TicketFormData = z.infer<typeof ticketFormSchema>;

// --- Component Form Ticket trong Dialog ---
const TicketFormContent = ({
  ticket,
  scheduleId,
  eventId,
  onSave,
  onCancel,
}: {
  ticket: TicketFormData | null;
  scheduleId: number;
  eventId: number;
  onSave: () => void;
  onCancel: () => void;
}) => {
  const queryClient = useQueryClient();

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      name: ticket?.name || "",
      description: ticket?.description || "",
      price: ticket?.price || "",
      originalQuantity: ticket?.originalQuantity || "",
      saleStartDate: ticket?.saleStartDate
        ? toLocalDateTimeString(ticket.saleStartDate)
        : toLocalDateTimeString(new Date()),
      saleEndDate: ticket?.saleEndDate
        ? toLocalDateTimeString(ticket.saleEndDate)
        : toLocalDateTimeString(new Date()),
    },
  });

  useEffect(() => {
    if (ticket) {
      form.reset({
        id: ticket.id,
        name: ticket.name,
        description: ticket.description || "",
        price: ticket.price,
        originalQuantity: ticket.originalQuantity,
        saleStartDate: ticket.saleStartDate
          ? toLocalDateTimeString(ticket.saleStartDate)
          : "",
        saleEndDate: ticket.saleEndDate
          ? toLocalDateTimeString(ticket.saleEndDate)
          : "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price: "",
        originalQuantity: "",
        saleStartDate: toLocalDateTimeString(new Date()),
        saleEndDate: toLocalDateTimeString(new Date()),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket]);

  const createTicketMutation = useMutation({
    mutationFn: postCreateTicketType,
    onSuccess: async () => {
      // Invalidate and refetch all queries for this event
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length > 0 &&
            key[0] === "events" &&
            typeof key[1] === "number" &&
            key[1] === eventId
          );
        },
      });
      // Refetch immediately
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length > 0 &&
            key[0] === "events" &&
            typeof key[1] === "number" &&
            key[1] === eventId
          );
        },
      });
      toast.success("Tạo loại vé thành công!");
      onSave();
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: number; data: any }) =>
      putUpdateTicketType(ticketId, data),
    onSuccess: async () => {
      // Invalidate and refetch all queries for this event
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length > 0 &&
            key[0] === "events" &&
            typeof key[1] === "number" &&
            key[1] === eventId
          );
        },
      });
      // Refetch immediately
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length > 0 &&
            key[0] === "events" &&
            typeof key[1] === "number" &&
            key[1] === eventId
          );
        },
      });
      toast.success("Cập nhật loại vé thành công!");
      onSave();
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    const ticketData = {
      name: data.name,
      description: data.description || "",
      price: data.price,
      originalQuantity: parseInt(data.originalQuantity),
      saleStartDate: new Date(data.saleStartDate).toISOString(),
      saleEndDate: new Date(data.saleEndDate).toISOString(),
    };

    if (ticket?.id) {
      updateTicketMutation.mutate({
        ticketId: ticket.id,
        data: ticketData,
      });
    } else {
      createTicketMutation.mutate({
        scheduleId,
        ...ticketData,
      });
    }
  };

  const isLoading =
    createTicketMutation.isPending || updateTicketMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <DialogHeader>
        <DialogTitle>
          {ticket?.id ? "Chỉnh sửa loại vé" : "Tạo loại vé mới"}
        </DialogTitle>
        <DialogDescription>
          Nhập thông tin chi tiết cho loại vé của bạn. Nhấn lưu khi hoàn tất.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto">
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  Tên loại vé <span className="text-red-600">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  placeholder="Ví dụ: Vé VIP"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Mô tả</FieldLabel>
                <Textarea
                  {...field}
                  placeholder="Mô tả loại vé"
                  rows={2}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="price"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Giá (EVT) <span className="text-red-600">*</span>
                  </FieldLabel>
                  <Input
                    type="number"
                    {...field}
                    placeholder="0"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="originalQuantity"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Số lượng <span className="text-red-600">*</span>
                  </FieldLabel>
                  <Input
                    type="number"
                    {...field}
                    placeholder="0"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="saleStartDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Ngày bắt đầu bán <span className="text-red-600">*</span>
                  </FieldLabel>
                  <Input
                    type="datetime-local"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="saleEndDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Ngày kết thúc bán <span className="text-red-600">*</span>
                  </FieldLabel>
                  <Input
                    type="datetime-local"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          type="button"
        >
          Hủy
        </Button>
        <Button
          className="bg-red-600 hover:bg-red-700"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Đang lưu..." : "Lưu"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// --- Component Form bên trong Dialog ---
const SessionFormContent = ({
  session,
  eventId,
  onSave,
  onCancel,
}: {
  session: SessionFormData | null;
  eventId: number;
  onSave: (data: SessionFormData) => void;
  onCancel: () => void;
}) => {
  const queryClient = useQueryClient();

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      startDate: session?.startDate
        ? toLocalDateTimeString(session.startDate)
        : toLocalDateTimeString(new Date()),
      endDate: session?.endDate
        ? toLocalDateTimeString(session.endDate)
        : toLocalDateTimeString(new Date()),
      organizerAddress: session?.organizerAddress || "",
    },
  });

  // Update form when session changes
  useEffect(() => {
    if (session) {
      form.reset({
        id: session.id,
        startDate: toLocalDateTimeString(session.startDate),
        endDate: toLocalDateTimeString(session.endDate),
        organizerAddress: session.organizerAddress,
      });
    } else {
      form.reset({
        startDate: toLocalDateTimeString(new Date()),
        endDate: toLocalDateTimeString(new Date()),
        organizerAddress: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const createScheduleMutation = useMutation({
    mutationFn: postCreateSchedule,
    onSuccess: async (result) => {
      // Invalidate and refetch schedule query and sessions with tickets query
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length > 0 &&
            key[0] === "events" &&
            typeof key[1] === "number" &&
            key[1] === eventId
          );
        },
      });
      // Refetch immediately
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length > 0 &&
            key[0] === "events" &&
            typeof key[1] === "number" &&
            key[1] === eventId
          );
        },
      });
      return result.data.id;
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ scheduleId, data }: { scheduleId: number; data: any }) =>
      putUpdateSchedule(scheduleId, data),
    onSuccess: async () => {
      // Invalidate and refetch schedule query and sessions with tickets query
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length > 0 &&
            key[0] === "events" &&
            typeof key[1] === "number" &&
            key[1] === eventId
          );
        },
      });
      // Refetch immediately
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length > 0 &&
            key[0] === "events" &&
            typeof key[1] === "number" &&
            key[1] === eventId
          );
        },
      });
    },
  });

  const onSubmit = async (data: SessionFormData) => {
    try {
      const scheduleData = {
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        organizerAddress: data.organizerAddress,
      };

      let scheduleId: number;
      if (session?.id) {
        // Update existing schedule
        const response = await updateScheduleMutation.mutateAsync({
          scheduleId: session.id,
          data: scheduleData,
        });
        scheduleId = response.data.id;
        toast.success(response.message || "Cập nhật suất diễn thành công!");
      } else {
        // Create new schedule
        const response = await createScheduleMutation.mutateAsync({
          eventId,
          ...scheduleData,
        });
        scheduleId = response.data.id;
        toast.success(response.message || "Tạo suất diễn thành công!");
      }

      onSave({ ...data, id: scheduleId });
    } catch (error: any) {
      console.error("Lỗi khi lưu suất diễn:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Đã có lỗi xảy ra khi lưu suất diễn."
      );
    }
  };

  const isLoading =
    createScheduleMutation.isPending || updateScheduleMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <DialogHeader>
        <DialogTitle>
          {session?.id ? "Chỉnh sửa suất diễn" : "Tạo suất diễn mới"}
        </DialogTitle>
        <DialogDescription>
          Nhập thông tin chi tiết cho suất diễn của bạn. Nhấn lưu khi hoàn tất.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto">
        <FieldGroup>
          <Controller
            name="startDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  Thời gian bắt đầu <span className="text-red-600">*</span>
                </FieldLabel>
                <Input
                  type="datetime-local"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="endDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  Thời gian kết thúc <span className="text-red-600">*</span>
                </FieldLabel>
                <Input
                  type="datetime-local"
                  {...field}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="organizerAddress"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  Địa chỉ ví tổ chức <span className="text-red-600">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  placeholder="Nhập địa chỉ ví tổ chức"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          type="button"
        >
          Hủy
        </Button>
        <Button
          className="bg-red-600 hover:bg-red-700"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Đang lưu..." : "Lưu"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// --- Component chính: Step2 ---
export const Step2 = ({ eventId }: Step2Props) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionFormData | null>(
    null
  );
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketFormData | null>(
    null
  );
  const [currentScheduleId, setCurrentScheduleId] = useState<number | null>(
    null
  );
  const [deleteScheduleDialogOpen, setDeleteScheduleDialogOpen] =
    useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);
  const [deleteTicketDialogOpen, setDeleteTicketDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<number | null>(null);

  // Query schedules
  const schedulesQuery = useQuery({
    queryKey: eventId ? getMySchedule.queryKey(eventId) : ["schedules"],
    queryFn: () => getMySchedule(eventId!),
    enabled: !!eventId,
    refetchOnMount: true,
  });

  // Load tickets for each schedule
  const sessionsWithTickets = useQuery({
    queryKey: eventId
      ? [...getMySchedule.queryKey(eventId), "with-tickets"]
      : ["schedules", "with-tickets"],
    queryFn: async () => {
      if (!schedulesQuery.data?.data) return [];
      return Promise.all(
        schedulesQuery.data.data.map(async (schedule) => {
          const ticketsResponse = await getMyTicketType(schedule.id);
          return {
            ...schedule,
            tickets:
              ticketsResponse.status && ticketsResponse.data
                ? ticketsResponse.data.map((t) => ({
                    id: t.id,
                    name: t.name,
                    description: t.description,
                    price: t.price,
                    originalQuantity: String(t.originalQuantity),
                    saleStartDate: toLocalDateTimeString(t.saleStartDate),
                    saleEndDate: toLocalDateTimeString(t.saleEndDate),
                  }))
                : [],
          };
        })
      );
    },
    enabled: !!schedulesQuery.data?.data && schedulesQuery.data.data.length > 0,
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: async (result) => {
      toast.success(result.message || "Xóa suất diễn thành công!");
      // Invalidate and refetch schedule query and sessions with tickets query
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length > 0 &&
            key[0] === "events" &&
            typeof key[1] === "number" &&
            key[1] === eventId
          );
        },
      });
      // Refetch immediately
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length > 0 &&
            key[0] === "events" &&
            typeof key[1] === "number" &&
            key[1] === eventId
          );
        },
      });
      setDeleteScheduleDialogOpen(false);
      setScheduleToDelete(null);
    },
  });

  const handleOpenDialogForEdit = (schedule: TEventSchedule) => {
    setEditingSession({
      id: schedule.id,
      startDate: toLocalDateTimeString(schedule.startDate),
      endDate: toLocalDateTimeString(schedule.endDate),
      organizerAddress: schedule.organizerAddress,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDialogForCreate = () => {
    setEditingSession(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => setEditingSession(null), 300);
  };

  const handleSaveSession = async () => {
    handleCloseDialog();
    // Invalidate and refetch all queries for this event
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return (
          Array.isArray(key) &&
          key.length > 0 &&
          key[0] === "events" &&
          typeof key[1] === "number" &&
          key[1] === eventId
        );
      },
    });
    // Refetch immediately
    await queryClient.refetchQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return (
          Array.isArray(key) &&
          key.length > 0 &&
          key[0] === "events" &&
          typeof key[1] === "number" &&
          key[1] === eventId
        );
      },
    });
  };

  const handleRemoveSession = async (scheduleId: number) => {
    setScheduleToDelete(scheduleId);
    setDeleteScheduleDialogOpen(true);
  };

  const deleteTicketMutation = useMutation({
    mutationFn: deleteTicketType,
    onSuccess: async (result) => {
      toast.success(result.message || "Xóa loại vé thành công!");
      // Invalidate and refetch schedule query to refresh sessionsWithTickets
      await queryClient.invalidateQueries({
        queryKey: getMySchedule.queryKey(eventId!),
      });
      // Refetch immediately - this will also trigger sessionsWithTickets to refetch
      await queryClient.refetchQueries({
        queryKey: getMySchedule.queryKey(eventId!),
      });
      setDeleteTicketDialogOpen(false);
      setTicketToDelete(null);
    },
  });

  const handleOpenTicketDialogForCreate = (scheduleId: number) => {
    setCurrentScheduleId(scheduleId);
    setEditingTicket(null);
    setIsTicketDialogOpen(true);
  };

  const handleOpenTicketDialogForEdit = (
    ticket: TicketFormData,
    scheduleId: number
  ) => {
    setCurrentScheduleId(scheduleId);
    setEditingTicket(ticket);
    setIsTicketDialogOpen(true);
  };

  const handleCloseTicketDialog = () => {
    setIsTicketDialogOpen(false);
    setTimeout(() => {
      setEditingTicket(null);
      setCurrentScheduleId(null);
    }, 300);
  };

  const handleSaveTicket = async () => {
    handleCloseTicketDialog();
    // Invalidate and refetch all queries for this event
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return (
          Array.isArray(key) &&
          key.length > 0 &&
          key[0] === "events" &&
          typeof key[1] === "number" &&
          key[1] === eventId
        );
      },
    });
    // Refetch immediately
    await queryClient.refetchQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return (
          Array.isArray(key) &&
          key.length > 0 &&
          key[0] === "events" &&
          typeof key[1] === "number" &&
          key[1] === eventId
        );
      },
    });
  };

  const handleRemoveTicket = async (ticketId: number) => {
    setTicketToDelete(ticketId);
    setDeleteTicketDialogOpen(true);
  };

  if (!eventId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          Vui lòng tạo sự kiện trước khi thêm suất diễn
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-7">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Thời Gian</h2>
      </div>

      {schedulesQuery.isLoading || sessionsWithTickets.isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {sessionsWithTickets.data && sessionsWithTickets.data.length > 0 ? (
              sessionsWithTickets.data.map((session) => (
                <Card key={session.id}>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between hover:bg-gray-50 rounded-lg p-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {new Date(session.startDate).toLocaleDateString(
                            "vi-VN"
                          )}{" "}
                          -{" "}
                          {new Date(session.startDate).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        <span className="text-sm text-gray-500">
                          Đến:{" "}
                          {new Date(session.endDate).toLocaleDateString(
                            "vi-VN"
                          )}{" "}
                          -{" "}
                          {new Date(session.endDate).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        <span className="text-sm text-gray-500">
                          Địa chỉ ví tổ chức: {session.organizerAddress}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialogForEdit(session)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-red-600"
                          onClick={() => handleRemoveSession(session.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Danh sách vé */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 text-sm">
                          Loại vé
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7"
                          onClick={() =>
                            handleOpenTicketDialogForCreate(session.id)
                          }
                        >
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Thêm vé
                        </Button>
                      </div>
                      {session.tickets && session.tickets.length > 0 ? (
                        <div className="space-y-2">
                          {session.tickets.map((ticket) => (
                            <div
                              key={ticket.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <Ticket className="h-4 w-4 text-gray-500" />
                                <div className="flex-1">
                                  <span className="font-medium text-sm text-gray-900">
                                    {ticket.name}
                                  </span>
                                  <div className="text-xs text-gray-500">
                                    {ticket.price} EVT • Số lượng:{" "}
                                    {ticket.originalQuantity}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    handleOpenTicketDialogForEdit(
                                      ticket,
                                      session.id
                                    )
                                  }
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:text-red-600"
                                  onClick={() =>
                                    ticket.id && handleRemoveTicket(ticket.id)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-2">
                          Chưa có loại vé nào
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Chưa có suất diễn nào. Hãy tạo suất diễn đầu tiên!
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleOpenDialogForCreate}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Tạo suất diễn
          </Button>
        </>
      )}

      {/* --- Dialog để Tạo/Sửa Suất diễn --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          {isDialogOpen && eventId && (
            <SessionFormContent
              session={editingSession}
              eventId={eventId}
              onSave={handleSaveSession}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* --- Dialog để Tạo/Sửa Vé --- */}
      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          {isTicketDialogOpen && currentScheduleId && eventId && (
            <TicketFormContent
              ticket={editingTicket}
              scheduleId={currentScheduleId}
              eventId={eventId}
              onSave={handleSaveTicket}
              onCancel={handleCloseTicketDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* --- AlertDialog để Xác nhận Xóa Suất diễn --- */}
      <AlertDialog
        open={deleteScheduleDialogOpen}
        onOpenChange={setDeleteScheduleDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa suất diễn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa suất diễn này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteScheduleDialogOpen(false);
                setScheduleToDelete(null);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (scheduleToDelete) {
                  deleteScheduleMutation.mutate(scheduleToDelete);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteScheduleMutation.isPending}
            >
              {deleteScheduleMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- AlertDialog để Xác nhận Xóa Loại vé --- */}
      <AlertDialog
        open={deleteTicketDialogOpen}
        onOpenChange={setDeleteTicketDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa loại vé</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa loại vé này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteTicketDialogOpen(false);
                setTicketToDelete(null);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (ticketToDelete) {
                  deleteTicketMutation.mutate(ticketToDelete);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTicketMutation.isPending}
            >
              {deleteTicketMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
