import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

import type { ProductDetailResponse } from "@/types/product.types";
import type { SupportedLanguage } from "@/types/language.types";

interface UseProductDetailParams {
  barcode: string | null;
  language: SupportedLanguage;
}

export const useProductDetail = ({
  barcode,
  language,
}: UseProductDetailParams) =>
  useQuery({
    queryKey: ["product", barcode, language],
    queryFn: () =>
      apiGet<ProductDetailResponse>(`/product/${barcode}`, {
        lang: language,
      }),
    enabled: barcode !== null,
  });
