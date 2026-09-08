import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

import type { OpenFoodFactsSearchResult } from "@/types/product.types";
import type { SupportedLanguage } from "@/types/language.types";

interface UseProductSearchParams {
  submittedSearch: string;
  language: SupportedLanguage;
  page: number;
  pageSize: number;
}

// Only enabled once a search has actually been submitted (button press),
// never on every keystroke. `language`, unlike `submittedSearch`, is the
// live selector value: switching the UI language is meant to immediately
// re-fetch whatever's on screen in the new language, so it deliberately
// is NOT locked to the value at submission time the way the search text
// is.
export const useProductSearch = ({
  submittedSearch,
  language,
  page,
  pageSize,
}: UseProductSearchParams) =>
  useQuery({
    queryKey: ["products", submittedSearch, language, page, pageSize],
    queryFn: () =>
      apiGet<OpenFoodFactsSearchResult>("/products", {
        search: submittedSearch,
        lang: language,
        page,
        pageSize,
      }),
    enabled: submittedSearch.trim().length > 0,
    placeholderData: (previous) => previous,
  });
