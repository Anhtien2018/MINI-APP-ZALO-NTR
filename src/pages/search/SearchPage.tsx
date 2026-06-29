import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { SearchBar } from "@/components/search-bar/SearchBar";
import { PropertyCard } from "@/components/property-card/PropertyCard";
import { FilterModal } from "@/components/filter-modal/FilterModal";
import { QuickFilterBar } from "@/components/quick-filter-bar/QuickFilterBar";
import { useAppStore, useListingsStore, useSearchResultsStore } from "@/store";
import { getLarkPropertiesPaginated } from "@/services/api";
import { PAGE_LIMIT } from "@/constants";
import "@/pages/listings/ListingsPage.css";

function SearchFilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="listings-toolbar__select-wrap">
      <select className="listings-toolbar__select" {...props} />
      <svg
        className="listings-toolbar__select-arrow"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M6 9l6 6 6-6"
          stroke="#999"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function SkeletonCards() {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="property-skeleton">
          <div className="property-skeleton__img skeleton-pulse" />
          <div className="property-skeleton__body">
            <div className="skeleton-pulse skeleton-line" style={{ width: "90%" }} />
            <div className="skeleton-pulse skeleton-line" style={{ width: "60%" }} />
          </div>
        </div>
      ))}
    </>
  );
}

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const webConfig = useAppStore((s) => s.webConfig);
  const businessTypes = useAppStore((s) => s.businessTypes);
  const propertyCategories = useAppStore((s) => s.propertyCategories);
  const cities = useAppStore((s) => s.cities);
  const districts = useAppStore((s) => s.districts);

  const filter = useListingsStore((s) => s.filter);
  const setFilter = useListingsStore((s) => s.setFilter);

  const properties = useSearchResultsStore((s) => s.properties);
  const total = useSearchResultsStore((s) => s.total);
  const page = useSearchResultsStore((s) => s.page);
  const hasMore = useSearchResultsStore((s) => s.hasMore);
  const resultsCacheKey = useSearchResultsStore((s) => s.cacheKey);
  const setResults = useSearchResultsStore((s) => s.setResults);
  const appendResults = useSearchResultsStore((s) => s.appendResults);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const filtersOpen = useListingsStore((s) => s.filtersOpen);
  const [filterOpen, setFilterOpen] = useState(false);

  const statusActive = webConfig?.status_properties?.active ?? undefined;
  const districtOptions = filter.city ? districts.filter((d) => d.province_id === filter.city) : [];
  const observerRef = useRef<IntersectionObserver | null>(null);
  const midpointRef = useRef<HTMLDivElement>(null);
  const filterCacheKey = JSON.stringify({ statusActive, filter });

  useEffect(() => {
    const typeFromUrl = searchParams.get("type") ?? "";
    const searchFromUrl = searchParams.get("search") ?? "";
    if (typeFromUrl) setFilter({ transactionType: typeFromUrl });
    if (searchFromUrl) setFilter({ search: searchFromUrl });
  }, []);

  const fetchProperties = useCallback(
    async (pageNum: number, reset = false) => {
      if (reset) setIsFiltering(true);
      else setIsLoadingMore(true);
      try {
        const result = await getLarkPropertiesPaginated({
          page: pageNum,
          limit: PAGE_LIMIT,
          status: statusActive,
          transactionType: filter.transactionType || undefined,
          propertyType: filter.propertyType || undefined,
          city: filter.city || undefined,
          district: filter.district || undefined,
          search: filter.search || undefined,
          priceRange: filter.priceRange || undefined,
          features: filter.features?.length ? filter.features : undefined,
        });
        const nextHasMore = pageNum * PAGE_LIMIT < result.total;
        if (reset) {
          setResults(result.data, result.total, nextHasMore, filterCacheKey);
        } else {
          appendResults(result.data, pageNum, nextHasMore);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (reset) setIsFiltering(false);
        else setIsLoadingMore(false);
      }
    },
    [filter, statusActive, filterCacheKey, setResults, appendResults],
  );

  useEffect(() => {
    // Same filter as last fetch (e.g. navigating back from a property's
    // detail page) — keep showing the cached results & page instead of
    // resetting to page 1 and refetching.
    if (filterCacheKey === resultsCacheKey) return;
    fetchProperties(1, true);
    // filterCacheKey already derives from statusActive + filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCacheKey]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFiltering && !isLoadingMore) {
          fetchProperties(page + 1);
        }
      },
      { threshold: 0.1 },
    );
    // Watch the card halfway through the currently loaded list (not the very
    // last one) so the next page starts loading before the user hits bottom.
    if (midpointRef.current) observerRef.current.observe(midpointRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, isFiltering, isLoadingMore, page, fetchProperties, properties.length]);

  const hasFilter =
    !!filter.transactionType ||
    !!filter.propertyType ||
    !!filter.city ||
    !!filter.district ||
    !!filter.priceRange ||
    !!filter.search ||
    (filter.features?.length ?? 0) > 0;

  const midpointIndex = Math.max(0, Math.floor(properties.length / 2) - 1);

  return (
    <PageLayout>
      <SearchBar />

      <div className="listings-toolbar">
        <QuickFilterBar />
      </div>

      {filtersOpen && (
        <div className="listings-toolbar__filters">
          <div className="listings-toolbar__filters-row">
            <SearchFilterSelect
              value={filter.city}
              onChange={(e) => setFilter({ city: e.target.value, district: "" })}
            >
              <option value="">Tỉnh/ Thành phố</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SearchFilterSelect>

            <SearchFilterSelect
              value={filter.district}
              disabled={!filter.city || districtOptions.length === 0}
              onChange={(e) => setFilter({ district: e.target.value })}
            >
              <option value="">{filter.city ? "Quận/ Huyện" : "Chọn tỉnh trước"}</option>
              {districtOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </SearchFilterSelect>
          </div>

          <div className="listings-toolbar__filters-row">
            <SearchFilterSelect
              value={filter.transactionType}
              onChange={(e) => setFilter({ transactionType: e.target.value, propertyType: "" })}
            >
              <option value="">Loại giao dịch</option>
              {businessTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </SearchFilterSelect>

            <SearchFilterSelect
              value={filter.propertyType}
              onChange={(e) => setFilter({ propertyType: e.target.value })}
            >
              <option value="">Loại BĐS</option>
              {propertyCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SearchFilterSelect>
          </div>

          <div className="listings-toolbar__filters-row listings-toolbar__filters-row--bottom">
            <button className="listings-toolbar__advanced-btn" onClick={() => setFilterOpen(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <line
                  x1="4"
                  y1="6"
                  x2="20"
                  y2="6"
                  stroke="#555"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <line
                  x1="4"
                  y1="12"
                  x2="20"
                  y2="12"
                  stroke="#555"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <line
                  x1="4"
                  y1="18"
                  x2="20"
                  y2="18"
                  stroke="#555"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <circle cx="9" cy="6" r="2" fill="#fff" stroke="#555" strokeWidth="1.8" />
                <circle cx="16" cy="12" r="2" fill="#fff" stroke="#555" strokeWidth="1.8" />
                <circle cx="11" cy="18" r="2" fill="#fff" stroke="#555" strokeWidth="1.8" />
              </svg>
              Lọc nâng cao
            </button>

            {hasFilter && (
              <button
                className="listings-toolbar__clear-btn"
                onClick={() => useListingsStore.getState().resetFilter()}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      )}

      <FilterModal open={filterOpen} onClose={() => setFilterOpen(false)} />

      {isFiltering ? (
        <div className="listings-grid">
          <SkeletonCards />
        </div>
      ) : (
        <>
          <div className="listings-grid">
            {properties.map((p, i) => (
              <PropertyCard key={p.id} data={p} ref={i === midpointIndex ? midpointRef : undefined} />
            ))}
          </div>

          {isLoadingMore && (
            <div className="listings-grid">
              <SkeletonCards />
            </div>
          )}
        </>
      )}

      {!hasMore && properties.length > 0 && (
        <p className="listings-end">Đã hiển thị tất cả {total} kết quả</p>
      )}

      {!isFiltering && properties.length === 0 && (
        <div className="listings-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#ccc" strokeWidth="1.5" />
            <path d="M21 21l-4.35-4.35" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p>Không tìm thấy bất động sản</p>
          <button onClick={() => useListingsStore.getState().resetFilter()}>Xóa bộ lọc</button>
        </div>
      )}
    </PageLayout>
  );
}
