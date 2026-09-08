// Mirrors GET /api/subscriptions/prices's response
// (apps/api/src/controller/subscription.controller.ts)
export interface SubscriptionPrice {
  id: string;
  nickname: string | null;
  unitAmount: number | null;
  currency: string;
  interval: string | null;
}

export interface CheckoutResponse {
  url: string;
}

export interface CancelResponse {
  cancelled: true;
}
