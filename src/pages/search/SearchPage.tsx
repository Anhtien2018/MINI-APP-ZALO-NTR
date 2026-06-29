import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { SearchBar } from "@/components/search-bar/SearchBar";
import { PropertyCard } from "@/components/property-card/PropertyCard";
import { FilterModal } from "@/components/filter-modal/FilterModal";
import { useAppStore, useListingsStore } from "@/store";
import { getLarkPropertiesPaginated } from "@/services/api";
import type { ILarkProperty } from "@/types";
import { PAGE_LIMIT } from "@/constants";
import "@/pages/listings/ListingsPage.css";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const webConfig = useAppStore((s) => s.webConfig);

  const filter = useListingsStore((s) => s.filter);
  const setFilter = useListingsStore((s) => s.setFilter);

  const [properties, setProperties] = useState<ILarkProperty[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const statusActive = webConfig?.status_properties?.active ?? undefined;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const typeFromUrl = searchParams.get("type") ?? "";
    const searchFromUrl = searchParams.get("search") ?? "";
    if (typeFromUrl) setFilter({ transactionType: typeFromUrl });
    if (searchFromUrl) setFilter({ search: searchFromUrl });
  }, []);

  const fetchProperties = useCallback(
    async (pageNum: number, reset = false) => {
      setLoading(true);
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
        if (reset) {
          setProperties(result.data);
        } else {
          setProperties((prev) => [...prev, ...result.data]);
        }
        setTotal(result.total);
        setHasMore(pageNum * PAGE_LIMIT < result.total);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [filter, statusActive],
  );

  useEffect(() => {
    setPage(1);
    fetchProperties(1, true);
  }, [filter]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProperties(nextPage);
        }
      },
      { threshold: 0.1 },
    );
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, page, fetchProperties]);

  const hasFilter =
    !!filter.transactionType ||
    !!filter.propertyType ||
    !!filter.city ||
    !!filter.district ||
    !!filter.priceRange ||
    !!filter.search ||
    (filter.features?.length ?? 0) > 0;

  return (
    <PageLayout>
      <SearchBar />

      <div className="listings-toolbar">
        <button className="listings-toolbar__filter-btn" onClick={() => setFilterOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <line x1="4" y1="6" x2="20" y2="6" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="4" y1="12" x2="20" y2="12" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="4" y1="18" x2="20" y2="18" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="9" cy="6" r="2" fill="#fff" stroke="#111" strokeWidth="1.8" />
            <circle cx="16" cy="12" r="2" fill="#fff" stroke="#111" strokeWidth="1.8" />
            <circle cx="11" cy="18" r="2" fill="#fff" stroke="#111" strokeWidth="1.8" />
          </svg>
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

      <FilterModal open={filterOpen} onClose={() => setFilterOpen(false)} />

      <div className="listings-grid">
        {properties.map((p) => (
          <PropertyCard key={p.id} data={p} />
        ))}
      </div>

      {loading && (
        <div className="listings-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="property-skeleton">
              <div className="property-skeleton__img skeleton-pulse" />
              <div className="property-skeleton__body">
                <div
                  className="skeleton-pulse skeleton-line"
                  style={{ width: "90%" }}
                />
                <div
                  className="skeleton-pulse skeleton-line"
                  style={{ width: "60%" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={loadMoreRef} style={{ height: 40 }} />

      {!hasMore && properties.length > 0 && (
        <p className="listings-end">Đã hiển thị tất cả {total} kết quả</p>
      )}

      {!loading && properties.length === 0 && (
        <div className="listings-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#ccc" strokeWidth="1.5" />
            <path
              d="M21 21l-4.35-4.35"
              stroke="#ccc"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p>Không tìm thấy bất động sản</p>
          <button onClick={() => useListingsStore.getState().resetFilter()}>
            Xóa bộ lọc
          </button>
        </div>
      )}
    </PageLayout>
  );
}
