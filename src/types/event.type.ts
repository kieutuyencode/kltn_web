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

export type TGetOrganizerPaymentTicketDto = {
  eventId?: number;
  scheduleId?: number;
  statusId?: number;
  paymentTxhash?: string;
  limit?: number;
  page?: number;
};

export type TPaymentOrganizerStatus = {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type TPaymentOrganizer = {
  id: number;
  organizerAddress: string;
  txhash?: string | null;
  receiveAmount: string; // Decimal as string
  feeAmount: string; // Decimal as string
  scheduleId?: number | null;
  eventId?: number | null;
  userId?: number | null;
  statusId?: number | null;
  createdAt: string;
  updatedAt: string;
  schedule?: TEventSchedule;
  event?: TEvent;
  status?: TPaymentOrganizerStatus;
  user?: TUser;
};

export type TGetMyPaymentOrganizerDto = {
  statusId?: number;
  limit?: number;
  page?: number;
};

export type TRequestSchedulePayoutDto = {
  scheduleId: number;
};

export type TCheckInStatisticsOverview = {
  totalCheckedIn: number;
  totalSold: number;
  checkInRate: number;
};

export type TCheckInStatisticsDetail = {
  ticketTypeId: number;
  ticketTypeName: string;
  price: string;
  checkedIn: number;
  sold: number;
  checkInRate: number;
};

export type TCheckInStatistics = {
  overview: TCheckInStatisticsOverview;
  details: TCheckInStatisticsDetail[];
};

export type TRevenueStatisticsOverview = {
  totalRevenue: string; // Decimal as string
  totalRevenueTarget: string; // Decimal as string
  revenueRate: number;
  totalTicketsSold: number;
  totalTicketsTarget: number;
  ticketsRate: number;
};

export type TRevenueStatisticsChartData = {
  date: string;
  revenue: number;
  ticketsSold: number;
};

export type TRevenueStatisticsDetail = {
  ticketTypeId: number;
  ticketTypeName: string;
  price: string; // Decimal as string
  sold: number;
  total: number;
  salesRate: number;
};

export type TRevenueStatistics = {
  overview: TRevenueStatisticsOverview;
  chart: TRevenueStatisticsChartData[];
  details: TRevenueStatisticsDetail[];
};

export type TGetRevenueStatisticsDto = {
  scheduleId: number;
  period?: "24h" | "30d";
};
