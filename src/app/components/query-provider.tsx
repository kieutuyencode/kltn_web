"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            const response = (error as any)?.response;
            const result = response?.data;

            console.log({
              queryKey: query.queryKey,
              result,
            });

            if (response?.status === 500) {
              toast.error("Hệ thống đang gặp sự cố. Vui lòng thử lại sau.");
            } else if (response?.status < 500) {
              toast.warning(result?.message);
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, variables, context, mutation) => {
            const response = (error as any)?.response;
            const result = response?.data;

            console.log({
              variables,
              result,
            });

            if (response?.status === 500) {
              toast.error("Hệ thống đang gặp sự cố. Vui lòng thử lại sau.");
            } else if (response?.status < 500) {
              toast.warning(result?.message);
            }
          },
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
