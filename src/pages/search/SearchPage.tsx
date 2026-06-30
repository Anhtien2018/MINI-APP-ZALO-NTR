import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { SearchBar } from "@/components/search-bar/SearchBar";
import { PropertyCard } from "@/components/property-card/PropertyCard";
import { FilterModal } from "@/components/filter-modal/FilterModal";
import { QuickFilterBar } from "@/components/quick-filter-bar/QuickFilterBar";
import { useListingsStore } from "@/store";
import {
  useWebConfig,
  useBusinessTypes,
  usePropertyCategories,
  useCities,
  useDistricts,
} from "@/hooks/useConfigQueries";
import { useLarkPropertiesSearch } from "@/hooks/useListingsQueries";
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
  const { data: webConfig } = useWebConfig();
  const { data: businessTypes = [] } = useBusinessTypes();
  const { data: propertyCategories = [] } = usePropertyCategories();
  const { data: cities = [] } = useCities();
  const { data: districts = [] } = useDistricts();

  const filter = useListingsStore((s) => s.filter);
  const setFilter = useListingsStore((s) => s.setFilter);
  const filtersOpen = useListingsStore((s) => s.filtersOpen);
  const [filterOpen, setFilterOpen] = useState(false);

  const statusActive = webConfig?.status_properties?.active ?? undefined;
  const districtOptions = filter.city ? districts.filter((d) => d.province_id === filter.city) : [];
  const observerRef = useRef<IntersectionObserver | null>(null);
  const midpointRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const typeFromUrl = searchParams.get("type") ?? "";
    const searchFromUrl = searchParams.get("search") ?? "";
    if (typeFromUrl) setFilter({ transactionType: typeFromUrl });
    if (searchFromUrl) setFilter({ search: searchFromUrl });
  }, []);

  const {
    data,
    isLoading: isFiltering,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
  } = useLarkPropertiesSearch({
    status: statusActive,
    transactionType: filter.transactionType || undefined,
    propertyType: filter.propertyType || undefined,
    city: filter.city || undefined,
    district: filter.district || undefined,
    search: filter.search || undefined,
    priceRange: filter.priceRange || undefined,
    features: filter.features?.length ? filter.features : undefined,
  });

  const properties = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFiltering && !isLoadingMore) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    // Watch the card halfway through the currently loaded list (not the very
    // last one) so the next page starts loading before the user hits bottom.
    if (midpointRef.current) observerRef.current.observe(midpointRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, isFiltering, isLoadingMore, fetchNextPage, properties.length]);

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
              {businessTypes.map((t) => {
                const s = t.name.toLowerCase();
                return (
                  <option key={t.id} value={t.id}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                );
              })}
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
