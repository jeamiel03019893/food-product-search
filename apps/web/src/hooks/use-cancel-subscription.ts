import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import { AUTH_QUERY_KEY } from "./use-auth";

import type { CancelResponse } from "@/types/subscription.types";

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<CancelResponse>("/subscriptions/cancel"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });
};
