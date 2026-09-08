// Mirrors GET /api/auth's response (apps/api/src/controller/auth.controller.ts)
export interface AuthResponse {
  id: string;
  email: string;
  name: string | null;
  hasActiveSubscription: boolean;
  currentPriceId: string | null;
}
