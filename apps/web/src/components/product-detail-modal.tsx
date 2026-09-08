"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { isFullProduct } from "@/types/product.types";
import { ApiError } from "@/lib/api-client";
import { useTranslation } from "@/i18n/language-provider";

import type { ProductDetailResponse } from "@/types/product.types";

interface ProductDetailModalProps {
  barcode: string | null;
  data: ProductDetailResponse | undefined;
  isLoading: boolean;
  error: unknown;
  onOpenChange: (open: boolean) => void;
}

export const ProductDetailModal = ({
  barcode,
  data,
  isLoading,
  error,
  onOpenChange,
}: ProductDetailModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={barcode !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{data?.name ?? t("product.detailsTitle")}</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {error ? (
          <p className="text-sm text-destructive">
            {error instanceof ApiError && error.status === 404
              ? t("product.notFound")
              : t("product.loadError")}
          </p>
        ) : null}

        {data && (
          <div className="space-y-4">
            {data.imageUrl && (
              <div className="relative h-48 w-full overflow-hidden rounded-md bg-muted">
                <Image
                  src={data.imageUrl}
                  alt={data.name ?? t("common.productImageAlt")}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {data.brand ?? t("product.unknownBrand")}
              </p>
            </div>

            {isFullProduct(data) ? (
              <div className="space-y-3">
                {data.ingredientsText && (
                  <div>
                    <h3 className="text-sm font-medium">{t("product.ingredients")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {data.ingredientsText}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium">{t("product.nutrition")}</h3>
                  {data.nutriments ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(data.nutriments).map(([key, value]) =>
                        value === null ? null : (
                          <Badge key={key} variant="outline">
                            {key}: {value}
                          </Badge>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("product.noNutrition")}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {t("product.subscribeGate")}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
