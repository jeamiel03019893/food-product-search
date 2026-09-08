"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SubscriptionStatusButton } from "@/components/subscription/subscription-status-button";
import { LanguageSelector } from "@/components/language-selector";
import { SearchBar } from "@/components/search-bar";
import { ProductDataTable } from "@/components/product-table/product-data-table";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { SubscriptionPricesModal } from "@/components/subscription/subscription-prices-modal";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useProductSearch } from "@/hooks/use-product-search";
import { useProductDetail } from "@/hooks/use-product-detail";
import { useTranslation } from "@/i18n/language-provider";

const PAGE_SIZE = 10;

export default function Home() {
  const { t, language, switchingLanguage, notifyLanguageApplied } =
    useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detailBarcode, setDetailBarcode] = useState<string | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  const { data, isLoading, isError, isFetching } = useProductSearch({
    submittedSearch,
    language,
    page,
    pageSize: PAGE_SIZE,
  });

  // Lifted here (rather than inside ProductDetailModal) specifically so
  // the settle-tracking effect below can observe its `isFetching` too —
  // a modal-owned query would be invisible to this component.
  const {
    data: detailData,
    isLoading: detailLoading,
    error: detailError,
    isFetching: detailFetching,
  } = useProductDetail({ barcode: detailBarcode, language });

  // Once a language switch has been requested, clear it as soon as every
  // in-flight refetch for the new language has settled: the search query
  // always applies; the detail query only counts while its modal is
  // actually open (detailFetching is false when disabled, so this still
  // resolves correctly when no modal is open).
  useEffect(() => {
    if (!switchingLanguage) return;
    if (isFetching || detailFetching) return;
    notifyLanguageApplied();
  }, [switchingLanguage, isFetching, detailFetching, notifyLanguageApplied]);

  const handleSearch = () => {
    setSubmittedSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <SiteHeader onOpenSubscription={() => setSubscriptionModalOpen(true)} />

      <div className="flex items-center gap-3">
        <SubscriptionStatusButton
          onOpenSubscription={() => setSubscriptionModalOpen(true)}
        />
        <LanguageSelector />
      </div>

      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onSubmit={handleSearch}
      />

      <ProductDataTable
        products={data?.products ?? []}
        page={data?.page ?? page}
        pageSize={data?.pageSize ?? PAGE_SIZE}
        totalCount={data?.totalCount ?? 0}
        isLoading={isLoading}
        isError={isError}
        onPageChange={setPage}
        onView={setDetailBarcode}
      />

      <ProductDetailModal
        barcode={detailBarcode}
        data={detailData}
        isLoading={detailLoading}
        error={detailError}
        onOpenChange={(open) => !open && setDetailBarcode(null)}
      />

      <SubscriptionPricesModal
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
      />

      {switchingLanguage && <LoadingOverlay message={t("languageSwitch.overlayMessage")} />}
    </div>
  );
}
