"use client";

import { Loader2 } from "lucide-react";

// Full-page blur overlay shown while a mutation or refetch the user
// triggered is in flight (subscription checkout/switch, or a language
// switch). Stays mounted for the whole operation and is driven purely
// by the caller's own busy/pending state — it has no state of its own.
export const LoadingOverlay = ({ message }: { message: string }) => (
  <div
    role="alert"
    aria-live="assertive"
    className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm"
  >
    <Loader2 className="size-8 animate-spin text-primary" />
    <p className="text-sm font-medium text-foreground">{message}</p>
  </div>
);
