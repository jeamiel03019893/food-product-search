import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";

import type { CheckoutResponse } from "@/types/subscription.types";

export const useCheckout = () =>
  useMutation({
    mutationFn: (priceId: string) =>
      apiPost<CheckoutResponse>("/subscriptions/checkout", { priceId }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
