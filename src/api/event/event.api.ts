import { TResponse, TResponsePagination } from "~/types";
import {
  TEvent,
  TEventSchedule,
  TEventTicketType,
  TCreateEventDto,
  TUpdateEventDto,
  TCreateScheduleDto,
  TUpdateScheduleDto,
  TCreateTicketTypeDto,
  TUpdateTicketTypeDto,
  TGetMyEventDto,
  TGetPublicEventDto,
  TGetMyTicketDto,
  TGetMyPaymentTicketDto,
  TEventWithDetails,
  TEventDetail,
  TUserTicket,
  TPaymentTicket,
  TPaymentTicketStatus,
  TEventCategory,
  TEventStatus,
} from "~/types/event.type";
import { axiosAPI } from "~/utils";

// Create Event
type TPostCreateEventResponse = TResponse<TEvent>;
export const postCreateEvent = async (
  body: TCreateEventDto
): Promise<TPostCreateEventResponse> => {
  const response = await axiosAPI.post("/event", body);
  return response.data;
};

// Get My Events
type TGetMyEventResponse = TResponsePagination<TEvent[]>;
export const getMyEvent = async (
  params?: TGetMyEventDto
): Promise<TGetMyEventResponse> => {
  const response = await axiosAPI.get("/event", { params });
  return response.data;
};
getMyEvent.queryKey = (params?: TGetMyEventDto) => ["events", "my", params];

// Get Event Detail
type TGetEventDetailResponse = TResponse<TEvent>;
export const getEventDetail = async (
  eventId: number
): Promise<TGetEventDetailResponse> => {
  const response = await axiosAPI.get(`/event/${eventId}`);
  return response.data;
};
getEventDetail.queryKey = (eventId: number) => ["events", eventId];

// Update Event
type TPatchUpdateEventResponse = TResponse<TEvent>;
export const patchUpdateEvent = async (
  eventId: number,
  body: TUpdateEventDto
): Promise<TPatchUpdateEventResponse> => {
  const response = await axiosAPI.patch(`/event/${eventId}`, body);
  return response.data;
};

// Delete Event
type TDeleteEventResponse = TResponse;
export const deleteEvent = async (
  eventId: number
): Promise<TDeleteEventResponse> => {
  const response = await axiosAPI.delete(`/event/${eventId}`);
  return response.data;
};

// Create Schedule
type TPostCreateScheduleResponse = TResponse<TEventSchedule>;
export const postCreateSchedule = async (
  body: TCreateScheduleDto
): Promise<TPostCreateScheduleResponse> => {
  const response = await axiosAPI.post("/event/schedule", body);
  return response.data;
};

// Update Schedule
type TPutUpdateScheduleResponse = TResponse<TEventSchedule>;
export const putUpdateSchedule = async (
  scheduleId: number,
  body: TUpdateScheduleDto
): Promise<TPutUpdateScheduleResponse> => {
  const response = await axiosAPI.put(`/event/schedule/${scheduleId}`, body);
  return response.data;
};

// Delete Schedule
type TDeleteScheduleResponse = TResponse;
export const deleteSchedule = async (
  scheduleId: number
): Promise<TDeleteScheduleResponse> => {
  const response = await axiosAPI.delete(`/event/schedule/${scheduleId}`);
  return response.data;
};

// Get My Schedules
type TGetMyScheduleResponse = TResponse<TEventSchedule[]>;
export const getMySchedule = async (
  eventId: number
): Promise<TGetMyScheduleResponse> => {
  const response = await axiosAPI.get("/event/schedule", {
    params: { eventId },
  });
  return response.data;
};
getMySchedule.queryKey = (eventId: number) => ["events", eventId, "schedules"];

// Create Ticket Type
type TPostCreateTicketTypeResponse = TResponse<TEventTicketType>;
export const postCreateTicketType = async (
  body: TCreateTicketTypeDto
): Promise<TPostCreateTicketTypeResponse> => {
  const response = await axiosAPI.post("/event/ticket-type", body);
  return response.data;
};

// Update Ticket Type
type TPutUpdateTicketTypeResponse = TResponse<TEventTicketType>;
export const putUpdateTicketType = async (
  ticketTypeId: number,
  body: TUpdateTicketTypeDto
): Promise<TPutUpdateTicketTypeResponse> => {
  const response = await axiosAPI.put(
    `/event/ticket-type/${ticketTypeId}`,
    body
  );
  return response.data;
};

// Delete Ticket Type
type TDeleteTicketTypeResponse = TResponse;
export const deleteTicketType = async (
  ticketTypeId: number
): Promise<TDeleteTicketTypeResponse> => {
  const response = await axiosAPI.delete(`/event/ticket-type/${ticketTypeId}`);
  return response.data;
};

// Get My Ticket Types
type TGetMyTicketTypeResponse = TResponse<TEventTicketType[]>;
export const getMyTicketType = async (
  scheduleId: number
): Promise<TGetMyTicketTypeResponse> => {
  const response = await axiosAPI.get("/event/ticket-type", {
    params: { scheduleId },
  });
  return response.data;
};
getMyTicketType.queryKey = (scheduleId: number) => [
  "schedules",
  scheduleId,
  "ticket-types",
];

// Get Public Events
type TGetPublicEventResponse = TResponsePagination<TEventWithDetails[]>;
export const getPublicEvent = async (
  params?: TGetPublicEventDto
): Promise<TGetPublicEventResponse> => {
  const response = await axiosAPI.get("/event/public", { params });
  return response.data;
};
getPublicEvent.queryKey = (params?: TGetPublicEventDto) => [
  "events",
  "public",
  params,
];

// Get Public Event Detail
type TGetPublicEventDetailResponse = TResponse<TEventDetail>;
export const getPublicEventDetail = async (
  slug: string
): Promise<TGetPublicEventDetailResponse> => {
  const response = await axiosAPI.get(`/event/public/${slug}`);
  return response.data;
};
getPublicEventDetail.queryKey = (slug: string) => [
  "events",
  "public",
  slug,
];

// Buy Ticket
type TPostBuyTicketResponse = TResponse;
export const postBuyTicket = async (body: {
  paymentTxhash: string;
}): Promise<TPostBuyTicketResponse> => {
  const response = await axiosAPI.post("/event/buy-ticket", body);
  return response.data;
};

// Get My Tickets
type TGetMyTicketResponse = TResponsePagination<TUserTicket[]>;
export const getMyTicket = async (
  params?: TGetMyTicketDto
): Promise<TGetMyTicketResponse> => {
  const response = await axiosAPI.get("/event/ticket", { params });
  return response.data;
};
getMyTicket.queryKey = (params?: TGetMyTicketDto) => [
  "events",
  "ticket",
  "my",
  params,
];

// Get Event Categories
type TGetEventCategoryResponse = TResponse<TEventCategory[]>;
export const getEventCategory = async (): Promise<TGetEventCategoryResponse> => {
  const response = await axiosAPI.get("/event/category");
  return response.data;
};
getEventCategory.queryKey = () => ["events", "category"];

// Get Event Statuses
type TGetEventStatusResponse = TResponse<TEventStatus[]>;
export const getEventStatus = async (): Promise<TGetEventStatusResponse> => {
  const response = await axiosAPI.get("/event/status");
  return response.data;
};
getEventStatus.queryKey = () => ["events", "status"];

// Get My Ticket Detail
type TGetMyTicketDetailResponse = TResponse<TUserTicket>;
export const getMyTicketDetail = async (
  ticketId: number
): Promise<TGetMyTicketDetailResponse> => {
  const response = await axiosAPI.get(`/event/ticket/${ticketId}`);
  return response.data;
};
getMyTicketDetail.queryKey = (ticketId: number) => [
  "events",
  "ticket",
  ticketId,
];

// Get Ticket QR Code
type TGetTicketQrCodeResponse = TResponse<string>;
export const getTicketQrCode = async (
  ticketId: number
): Promise<TGetTicketQrCodeResponse> => {
  const response = await axiosAPI.get(`/event/ticket/${ticketId}/qr-code`);
  return response.data;
};

// Transfer Ticket
type TPostTransferTicketResponse = TResponse;
export const postTransferTicket = async (body: {
  ticketId: number;
  email: string;
  txhash: string;
}): Promise<TPostTransferTicketResponse> => {
  const response = await axiosAPI.post("/event/transfer-ticket", body);
  return response.data;
};

// Get Payment Ticket Statuses
type TGetPaymentTicketStatusResponse = TResponse<TPaymentTicketStatus[]>;
export const getPaymentTicketStatus = async (): Promise<TGetPaymentTicketStatusResponse> => {
  const response = await axiosAPI.get("/event/payment-ticket-status");
  return response.data;
};
getPaymentTicketStatus.queryKey = () => ["events", "payment-ticket-status"];

// Get My Payment Tickets
type TGetMyPaymentTicketResponse = TResponsePagination<TPaymentTicket[]>;
export const getMyPaymentTicket = async (
  params?: TGetMyPaymentTicketDto
): Promise<TGetMyPaymentTicketResponse> => {
  const response = await axiosAPI.get("/event/payment-ticket", { params });
  return response.data;
};
getMyPaymentTicket.queryKey = (params?: TGetMyPaymentTicketDto) => [
  "events",
  "payment-ticket",
  "my",
  params,
];
