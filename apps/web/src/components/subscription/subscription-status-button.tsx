"use client";

import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { usePrices } from "@/hooks/use-prices";
import { useTranslation } from "@/i18n/language-provider";

interface SubscriptionStatusButtonProps {
  onOpenSubscription: () => void;
}

const INTERVAL_KEYS = {
  day: "subscription.interval.day",
  week: "subscription.interval.week",
  month: "subscription.interval.month",
  year: "subscription.interval.year",
} as const;

export const SubscriptionStatusButton = ({
  onOpenSubscription,
}: SubscriptionStatusButtonProps) => {
  const { data: auth, isLoading } = useAuth();
  const { data: prices } = usePrices();
  const { t } = useTranslation();
  const isSubscribed = auth?.hasActiveSubscription ?? false;

  const currentPrice = prices?.find((price) => price.id === auth?.currentPriceId);
  const intervalKey =
    currentPrice?.interval && currentPrice.interval in INTERVAL_KEYS
      ? INTERVAL_KEYS[currentPrice.interval as keyof typeof INTERVAL_KEYS]
      : null;

  const label = isSubscribed
    ? t("subscription.activeLabel", {
        interval: intervalKey ? t(intervalKey) : currentPrice?.interval ?? "",
      })
    : t("subscription.noSubscription");

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant={isSubscribed ? "default" : "outline"}
            className={cn(
              isSubscribed && "bg-blue-600 text-white hover:bg-blue-700",
            )}
            onClick={onOpenSubscription}
            disabled={isLoading}
          />
        }
      >
        {label}
      </TooltipTrigger>
      <TooltipContent>{t("subscription.tooltip")}</TooltipContent>
    </Tooltip>
  );
};
