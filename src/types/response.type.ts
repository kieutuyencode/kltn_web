export type TResponse<T = any> = {
  status: boolean;
  message?: string;
  data: T;
};

export type TResponsePagination<T = any> = TResponse<{
  count: number;
  rows: T;
}>;
