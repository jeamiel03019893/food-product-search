import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import { AUTH_QUERY_KEY } from "./use-auth";

import type {
  CancelResponse,
  CheckoutResponse,
} from "@/types/subscription.types";

// Cancels the current subscription, then immediately starts a Checkout
// Session for the newly selected price — one confirm click completes a
// plan switch, since the backend has no direct "change plan" endpoint.
export const useSwitchSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (priceId: string) => {
      await apiPost<CancelResponse>("/subscriptions/cancel");
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      return apiPost<CheckoutResponse>("/subscriptions/checkout", {
        priceId,
      });
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
};
