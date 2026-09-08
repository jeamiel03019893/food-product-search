"use client";

import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/i18n/language-provider";

interface SiteHeaderProps {
  onOpenSubscription: () => void;
}

export const SiteHeader = ({ onOpenSubscription }: SiteHeaderProps) => {
  const { data: auth } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between border-b border-border pb-4">
      <h2 className="text-2xl font-semibold tracking-tight">
        {t("app.title")}
      </h2>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              aria-label={auth?.name ?? t("nav.userMenu")}
            />
          }
        >
          <UserRound />
          {auth?.name ?? t("nav.account")}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onOpenSubscription}>
            {t("nav.subscription")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
