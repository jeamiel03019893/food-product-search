"use client";

import { useMemo } from "react";
import { useTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createColumns } from "./columns";
import { tableFeatureSet } from "./table-features";
import { useTranslation } from "@/i18n/language-provider";

import type { OpenFoodFactsProduct } from "@/types/product.types";

const EMPTY_PRODUCTS: OpenFoodFactsProduct[] = [];

interface ProductDataTableProps {
  products: OpenFoodFactsProduct[];
  page: number;
  pageSize: number;
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  onPageChange: (page: number) => void;
  onView: (barcode: string) => void;
}

export const ProductDataTable = ({
  products,
  page,
  pageSize,
  totalCount,
  isLoading,
  isError,
  onPageChange,
  onView,
}: ProductDataTableProps) => {
  // `t`'s identity already changes when the selected language changes
  // (see useTranslation), so this memo recomputes with fresh column
  // labels on a language switch without `language` needing to appear
  // in the dependency array itself.
  const { t } = useTranslation();
  const columns = useMemo(() => createColumns(onView, t), [onView, t]);
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  // Server-side pagination: `products` is already exactly one page's worth
  // of rows, so the table only needs the core (automatic) row model — our
  // own Previous/Next buttons drive `page` externally, not table state.
  const table = useTable({
    features: tableFeatureSet,
    columns,
    data: products.length > 0 ? products : EMPTY_PRODUCTS,
  });

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && isError && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-destructive"
                >
                  {t("table.fetchError")}
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && products.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && !isError && products.length > 0 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            {t("table.pageIndicator", { page: String(page), pageCount: String(pageCount) })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {t("table.previous")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            {t("table.next")}
          </Button>
        </div>
      )}
    </div>
  );
};
