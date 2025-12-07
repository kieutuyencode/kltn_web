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
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  ImageUpload,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "~/components";
import {
  postUploadFile,
  postCreateEvent,
  getEventDetail,
  patchUpdateEvent,
  getMyEvent,
} from "~/api";
import { EventCategory } from "~/data";
import { API_URL } from "~/constants";
import { generateSlug, getResourceClientUrl } from "~/utils";

const eventFormSchema = z.object({
  name: z
    .string("Tên sự kiện không hợp lệ.")
    .min(1, "Tên sự kiện không được để trống.")
    .max(100, "Tên sự kiện không được vượt quá 100 ký tự."),
  slug: z
    .string("Slug không hợp lệ.")
    .min(1, "Slug không được để trống.")
    .max(100, "Slug không được vượt quá 100 ký tự.")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug chỉ được chứa chữ thường, số và dấu gạch ngang."
    ),
  address: z
    .string("Địa chỉ không hợp lệ.")
    .min(1, "Địa chỉ không được để trống.")
    .max(100, "Địa chỉ không được vượt quá 100 ký tự."),
  description: z.string().min(1, "Mô tả không được để trống."),
  categoryId: z
    .string("Danh mục không hợp lệ.")
    .min(1, "Vui lòng chọn danh mục."),
  statusId: z
    .string("Trạng thái không hợp lệ.")
    .min(1, "Vui lòng chọn trạng thái."),
  image: z.string().optional(),
});

type EventFormDto = z.infer<typeof eventFormSchema>;

interface Step1Props {
  eventId?: number;
  onNext?: (eventId: number) => void;
}

export const Step1 = ({ eventId, onNext }: Step1Props) => {
  const queryClient = useQueryClient();
  const [eventImageUrl, setEventImageUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load event data if editing
  const eventDetailQuery = useQuery({
    queryKey: eventId ? getEventDetail.queryKey(eventId) : ["event-detail"],
    queryFn: () => getEventDetail(eventId!),
    enabled: !!eventId,
    refetchOnMount: true, // Refetch when component mounts to ensure fresh data
  });

  const form = useForm<EventFormDto>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      address: "",
      description: "",
      categoryId: "" as any,
      statusId: "" as any,
      image: "",
    },
  });

  // Update form data when event detail is loaded
  useEffect(() => {
    if (eventId && eventDetailQuery.data?.data) {
      const event = eventDetailQuery.data.data;
      const categoryIdString = event.categoryId ? String(event.categoryId) : "";
      const statusIdString = event.statusId ? String(event.statusId) : "";
      form.reset({
        name: event.name || "",
        slug: event.slug || "",
        address: event.address || "",
        description: event.description || "",
        categoryId: categoryIdString as any,
        statusId: statusIdString as any,
        image: event.image || "",
      });
      if (event.image) {
        const imageUrl = getResourceClientUrl(event.image);
        setEventImageUrl(imageUrl);
      }
      // Force update form state
      form.setValue("categoryId", categoryIdString as any, {
        shouldValidate: false,
      });
      form.setValue("statusId", statusIdString as any, {
        shouldValidate: false,
      });
    } else if (!eventId) {
      // Reset form to default when creating new event
      form.reset({
        name: "",
        slug: "",
        address: "",
        description: "",
        categoryId: "" as any,
        statusId: "1" as any, // Default to DRAFT
        image: "",
      });
      setEventImageUrl(null);
      setImageFileName(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, eventDetailQuery.data, eventDetailQuery.dataUpdatedAt]);

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setImageFileName(null);
      setEventImageUrl(
        eventDetailQuery.data?.data?.image
          ? `${API_URL.replace("/api/v1", "")}/${
              eventDetailQuery.data.data.image
            }`
          : null
      );
      form.setValue("image", eventDetailQuery.data?.data?.image || "");
      return;
    }

    setIsUploadingImage(true);
    try {
      const response = await postUploadFile(file);
      if (response.data && response.data.length > 0) {
        const fileName = response.data[0];
        setImageFileName(fileName);
        form.setValue("image", fileName);
        // Tạo preview từ file local
        const reader = new FileReader();
        reader.onloadend = () => {
          setEventImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        throw new Error("Upload thất bại");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Upload hình ảnh thất bại");
      setImageFileName(null);
      setEventImageUrl(
        eventDetailQuery.data?.data?.image
          ? `${API_URL.replace("/api/v1", "")}/${
              eventDetailQuery.data.data.image
            }`
          : null
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const createEventMutation = useMutation({
    mutationFn: postCreateEvent,
    onSuccess: (result) => {
      toast.success(result.message || "Tạo sự kiện thành công!");
      // Invalidate all event queries to refresh the list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key.length > 0 && key[0] === "events";
        },
      });
      if (onNext && result.data?.id) {
        onNext(result.data.id);
      }
      setImageFileName(null);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, data }: { eventId: number; data: any }) =>
      patchUpdateEvent(eventId, data),
    onSuccess: async (result) => {
      toast.success(result.message || "Cập nhật sự kiện thành công!");
      // Invalidate and refetch all event queries to refresh the list
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key.length > 0 && key[0] === "events";
        },
      });
      // Refetch event detail query immediately to update the form
      await queryClient.refetchQueries({
        queryKey: getEventDetail.queryKey(eventId!),
      });
      if (onNext) {
        onNext(eventId!);
      }
      setImageFileName(null);
    },
  });

  const onSubmit = (data: EventFormDto) => {
    if (!eventId && !imageFileName && !eventDetailQuery.data?.data?.image) {
      toast.error("Vui lòng chọn hình ảnh cho sự kiện!");
      return;
    }

    const submitData = {
      name: data.name,
      slug: data.slug || generateSlug(data.name),
      address: data.address,
      description: data.description || "",
      categoryId: parseInt(data.categoryId),
      statusId: parseInt(data.statusId),
      ...(imageFileName && { image: imageFileName }),
    };

    if (eventId) {
      updateEventMutation.mutate({ eventId, data: submitData });
    } else {
      if (!imageFileName) {
        toast.error("Vui lòng chọn hình ảnh cho sự kiện!");
        return;
      }
      createEventMutation.mutate({
        ...submitData,
        image: imageFileName,
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
      {/* Upload Ảnh */}
      <Card>
        <CardHeader>
          <CardTitle>Hình ảnh sự kiện</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            className="h-96"
            onFileChange={handleFileChange}
            initialImage={eventImageUrl}
          />
          {isUploadingImage && (
            <p className="text-sm text-muted-foreground mt-2">
              Đang tải ảnh lên...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Thông tin chi tiết */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin sự kiện</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="event-name">
                    Tên sự kiện <span className="text-red-600">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="event-name"
                    placeholder="Nhập tên sự kiện"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value);
                      form.setValue("slug", generateSlug(value));
                    }}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="slug"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="event-slug">Slug</FieldLabel>
                  <Input
                    {...field}
                    id="event-slug"
                    placeholder="Slug tự động tạo từ tên"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="categoryId"
              control={form.control}
              render={({ field, fieldState }) => {
                const currentValue = String(field.value || "");
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="event-category">
                      Danh mục <span className="text-red-600">*</span>
                    </FieldLabel>
                    <Select
                      key={`category-select-${eventId}-${currentValue}`}
                      value={currentValue}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                    >
                      <SelectTrigger id="event-category">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {EventCategory.filter(
                          (cat) => cat.name !== "Tất cả"
                        ).map((cat, index) => (
                          <SelectItem key={index} value={String(index + 1)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />

            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Địa chỉ sự kiện <span className="text-red-600">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="address"
                    placeholder="Nhập địa chỉ sự kiện"
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
                  <FieldLabel htmlFor="description">
                    Mô tả sự kiện <span className="text-red-600">*</span>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="description"
                    placeholder="Nhập mô tả sự kiện"
                    rows={8}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="statusId"
              control={form.control}
              render={({ field, fieldState }) => {
                const currentValue = String(field.value || "");
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="event-status">
                      Trạng thái <span className="text-red-600">*</span>
                    </FieldLabel>
                    <Select
                      key={`status-select-${eventId}-${currentValue}`}
                      value={currentValue}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                    >
                      <SelectTrigger id="event-status">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Nháp</SelectItem>
                        <SelectItem value="2">Hoạt động</SelectItem>
                        <SelectItem value="3">Không hoạt động</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      {eventDetailQuery.isLoading ? (
        <div className="text-center py-4">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <Button
          type="submit"
          disabled={
            createEventMutation.isPending ||
            updateEventMutation.isPending ||
            isUploadingImage
          }
        >
          {createEventMutation.isPending || updateEventMutation.isPending
            ? "Đang xử lý..."
            : eventId
            ? "Cập nhật sự kiện"
            : "Tạo sự kiện"}
        </Button>
      )}
    </form>
  );
};
