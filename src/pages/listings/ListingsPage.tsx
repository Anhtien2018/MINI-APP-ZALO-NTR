import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { SearchBar } from "@/components/search-bar/SearchBar";
import { Banner } from "@/components/banner/Banner";
import { SectionHeader } from "@/components/section-header/SectionHeader";
import { PropertyCard } from "@/components/property-card/PropertyCard";
import { useAppStore, useHomeStore, useListingsStore } from "@/store";
import { getLarkPropertiesByType, getLarkPropertyImageUrls } from "@/services/api";
import { preloadImages } from "@/utils/preloadImages";
import type { ILarkProperty } from "@/types";
import { ROUTES } from "@/constants";
import "./ListingsPage.css";

const SECTION_LABELS = [
  { title: "Căn hộ cho thuê", highlight: "đề xuất", highlightColor: "#000", key: "cho-thue" },
  { title: "Danh sách", highlight: "BĐS đang bán", key: "ds-cho-thue" },
];

export function ListingsPage() {
  const navigate = useNavigate();
  const webConfig = useAppStore((s) => s.webConfig);
  const sectionProperties = useHomeStore((s) => s.sectionProperties);
  const sectionLoaded = useHomeStore((s) => s.sectionLoaded);
  const setSectionProperties = useHomeStore((s) => s.setSectionProperties);
  const setFilter = useListingsStore((s) => s.setFilter);

  const listingTypes = webConfig?.listing_type ?? [];
  const statusActive = webConfig?.status_properties?.active ?? null;

  useEffect(() => {
    if (!webConfig || listingTypes.length === 0) return;

    listingTypes.slice(0, 2).forEach((lt, i) => {
      if (sectionLoaded[i as 0 | 1]) return;
      getLarkPropertiesByType(lt.id, statusActive, 6)
        .then((items) => {
          setSectionProperties(i as 0 | 1, items);
          preloadImages(items.flatMap(getLarkPropertyImageUrls));
        })
        .catch(console.error);
    });
  }, [webConfig]);

  const handleViewAll = (typeIndex: number) => {
    const lt = listingTypes[typeIndex];
    if (lt) setFilter({ transactionType: lt.id });
    navigate(ROUTES.SEARCH);
  };

  return (
    <PageLayout>
      <SearchBar />
      <Banner />

      <div className="listing-sections">
        {SECTION_LABELS.map((section, i) => {
          const items: ILarkProperty[] = sectionProperties[i as 0 | 1];
          const isLoading = !sectionLoaded[i as 0 | 1];

          return (
            <section key={section.key} className="listing-section">
              <SectionHeader
                title={section.title}
                titleHighlight={section.highlight}
                highlightColor={section.highlightColor}
                onViewAll={() => handleViewAll(i)}
                viewAllLabel={i === 0 ? undefined : "Xem tất cả"}
              />

              {isLoading ? (
                <PropertyGridSkeleton />
              ) : items.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="listing-section__grid">
                  {items.slice(0, 6).map((p) => (
                    <PropertyCard key={p.id} data={p} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </PageLayout>
  );
}

function EmptyState() {
  return (
    <div className="listing-section-empty">
      <p>Không có dữ liệu</p>
    </div>
  );
}

function PropertyGridSkeleton() {
  return (
    <div className="listing-section__grid">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="property-skeleton">
          <div className="property-skeleton__img skeleton-pulse" />
          <div className="property-skeleton__body">
            <div className="skeleton-pulse skeleton-line" style={{ width: "90%" }} />
            <div className="skeleton-pulse skeleton-line" style={{ width: "60%" }} />
            <div className="skeleton-pulse skeleton-line" style={{ width: "75%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
