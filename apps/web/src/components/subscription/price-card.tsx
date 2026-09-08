"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/language-provider";

import type { SubscriptionPrice } from "@/types/subscription.types";
import type { SupportedLanguage } from "@/types/language.types";

interface PriceCardProps {
  price: SubscriptionPrice;
  disabled: boolean;
  buttonLabel: string;
  onSelect: () => void;
}

const CURRENCY_LOCALE: Record<SupportedLanguage, string> = {
  en: "en-US",
  nl: "nl-NL",
  de: "de-DE",
  fr: "fr-FR",
};

const UNIT_KEYS = {
  day: "subscription.unit.day",
  week: "subscription.unit.week",
  month: "subscription.unit.month",
  year: "subscription.unit.year",
} as const;

export const PriceCard = ({
  price,
  disabled,
  buttonLabel,
  onSelect,
}: PriceCardProps) => {
  const { t, language } = useTranslation();

  const formatAmount = (unitAmount: number | null, currency: string): string => {
    if (unitAmount === null) return "—";
    return new Intl.NumberFormat(CURRENCY_LOCALE[language], {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(unitAmount / 100);
  };

  const unitKey =
    price.interval && price.interval in UNIT_KEYS
      ? UNIT_KEYS[price.interval as keyof typeof UNIT_KEYS]
      : null;

  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary"
      onClick={disabled ? undefined : onSelect}
    >
      <CardHeader>
        <CardTitle>{price.nickname ?? t("subscription.defaultPlanName")}</CardTitle>
        <CardDescription>
          {unitKey
            ? t("subscription.billedPer", { interval: t(unitKey) })
            : t("subscription.oneTime")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">
          {formatAmount(price.unitAmount, price.currency)}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="w-full"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {buttonLabel}
        </Button>
      </CardFooter>
    </Card>
  );
};
