"use client";

import Image from "next/image";
import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { tableFeatureSet } from "./table-features";

import type { OpenFoodFactsProduct } from "@/types/product.types";
import type { DictionaryKey } from "@/i18n/dictionary";

const helper = createColumnHelper<typeof tableFeatureSet, OpenFoodFactsProduct>();

export const createColumns = (
  onView: (barcode: string) => void,
  t: (key: DictionaryKey) => string,
) =>
  helper.columns([
    helper.display({
      id: "image",
      header: "",
      cell: ({ row }) => {
        const { imageUrl, name } = row.original;
        if (!imageUrl) {
          return <div className="size-10 rounded bg-muted" aria-hidden="true" />;
        }
        return (
          <div className="relative size-10 overflow-hidden rounded bg-muted">
            <Image
              src={imageUrl}
              alt={name ?? t("common.productImageAlt")}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        );
      },
    }),
    helper.accessor("name", {
      header: t("table.columnName"),
      cell: ({ row }) => row.original.name ?? "—",
    }),
    helper.accessor("brand", {
      header: t("table.columnBrand"),
      cell: ({ row }) => row.original.brand ?? "—",
    }),
    helper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onView(row.original.barcode)}
        >
          {t("table.view")}
        </Button>
      ),
    }),
  ]);
