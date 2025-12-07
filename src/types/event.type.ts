import type { TUser } from "./user.type";

export type TEventCategory = {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type TEventStatus = {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type TEventSchedule = {
  id: number;
  startDate: string;
  endDate: string;
  organizerAddress: string;
  assignTxhash?: string | null;
  eventId: number;
  createdAt: string;
  updatedAt: string;
};

export type TEventTicketType = {
  id: number;
  name: string;
  description: string;
  price: string; // Decimal as string
  originalQuantity: number;
  remainingQuantity: number;
  saleStartDate: string;
  saleEndDate: string;
  scheduleId: number;
  eventId: number;
  createdAt: string;
  updatedAt: string;
};

export type TEvent = {
  id: number;
  name: string;
  slug: string;
  address: string;
  description: string;
  image: string;
  categoryId: number;
  statusId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  category?: TEventCategory;
  status?: TEventStatus;
  schedules?: TEventSchedule[];
};

export type TCreateEventDto = {
  name: string;
  slug: string;
  address: string;
  description: string;
  image: string;
  categoryId: number;
  statusId: number;
};

export type TUpdateEventDto = Partial<TCreateEventDto> & {
  statusId?: number;
};

export type TCreateScheduleDto = {
  eventId: number;
  startDate: string;
  endDate: string;
  organizerAddress: string;
};

export type TUpdateScheduleDto = {
  startDate: string;
  endDate: string;
  organizerAddress: string;
};

export type TCreateTicketTypeDto = {
  scheduleId: number;
  name: string;
  description: string;
  price: string;
  originalQuantity: number;
  saleStartDate: string;
  saleEndDate: string;
};

export type TUpdateTicketTypeDto = {
  name: string;
  description: string;
  price: string;
  originalQuantity: number;
  saleStartDate: string;
  saleEndDate: string;
};

export type TGetMyEventDto = {
  search?: string;
  statusId?: number;
  limit?: number;
  page?: number;
};

export type TGetPublicEventDto = {
  search?: string;
  categoryId?: number;
  limit?: number;
  page?: number;
};

export type TGetMyTicketDto = {
  isRedeemed?: "1" | "0";
  limit?: number;
  page?: number;
};

export type TEventWithDetails = TEvent & {
  schedule?: TEventSchedule | null;
  ticketType?: TEventTicketType | null;
};

export type TEventDetail = TEvent & {
  schedules?: (TEventSchedule & {
    ticketTypes?: TEventTicketType[];
  })[];
  user?: TUser;
};

export type TUserTicket = {
  id: number;
  walletAddress: string;
  isRedeemed: boolean;
  ticketTypeId: number;
  scheduleId: number;
  eventId: number;
  userId: number;
  _ticketId: number;
  createdAt: string;
  updatedAt: string;
  ticketType?: TEventTicketType;
  schedule?: TEventSchedule;
  event?: TEvent;
  user?: TUser;
};

export type TPaymentTicketStatus = {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type TPaymentTicket = {
  id: number;
  walletAddress: string;
  paymentTxhash: string;
  mintTxhash?: string | null;
  tokenAmount: string; // Decimal as string
  ticketQuantity: number;
  ticketTypeId?: number | null;
  scheduleId?: number | null;
  eventId?: number | null;
  statusId?: number | null;
  userId?: number | null;
  createdAt: string;
  updatedAt: string;
  ticketType?: TEventTicketType;
  schedule?: TEventSchedule;
  event?: TEvent;
  status?: TPaymentTicketStatus;
  user?: TUser;
};

export type TGetMyPaymentTicketDto = {
  statusId?: number;
  limit?: number;
  page?: number;
};
