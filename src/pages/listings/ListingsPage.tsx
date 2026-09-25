import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Banner } from "@/components/banner/Banner";
import { SectionHeader } from "@/components/section-header/SectionHeader";
import { PropertyCard } from "@/components/property-card/PropertyCard";
import { useListingsStore } from "@/store";
import { useWebConfig } from "@/hooks/useConfigQueries";
import { useLarkPropertiesByType } from "@/hooks/useListingsQueries";
import { getLarkPropertyImageUrls } from "@/services/api";
import { preloadImages } from "@/utils/preloadImages";
import { ROUTES } from "@/constants";
import "./ListingsPage.css";

// Giống trang chủ web (HomeContent): 3 loại giao dịch đầu của
// web_configuration.listing_type, section không có tin thì ẩn.
const SECTION_LABELS = [
  { title: "Bất động sản", highlight: "cho thuê", key: "cho-thue" },
  { title: "Bất động sản", highlight: "đang bán", key: "dang-ban" },
  { title: "Bất động sản", highlight: "dự án", key: "du-an" },
];

export function ListingsPage() {
  const navigate = useNavigate();
  const { data: webConfig } = useWebConfig();
  const setFilter = useListingsStore((s) => s.setFilter);

  const listingTypes = webConfig?.listing_type ?? [];
  const statusActive = webConfig?.status_properties?.active ?? null;

  const section0 = useLarkPropertiesByType(listingTypes[0]?.id, statusActive, 6);
  const section1 = useLarkPropertiesByType(listingTypes[1]?.id, statusActive, 6);
  const section2 = useLarkPropertiesByType(listingTypes[2]?.id, statusActive, 6);
  const sections = [section0, section1, section2] as const;

  useEffect(() => {
    sections.forEach((s) => {
      if (s.data) preloadImages(s.data.flatMap(getLarkPropertyImageUrls));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section0.data, section1.data, section2.data]);

  const handleViewAll = (typeIndex: number) => {
    const lt = listingTypes[typeIndex];
    if (lt) setFilter({ transactionType: lt.id });
    navigate(ROUTES.SEARCH);
  };

  return (
    <PageLayout>
      <Banner />

      <div className="listing-sections">
        {SECTION_LABELS.map((section, i) => {
          const items = sections[i].data ?? [];
          const isLoading = sections[i].isLoading;
          if (!isLoading && items.length === 0) return null;

          return (
            <section key={section.key} className="listing-section">
              <SectionHeader
                title={section.title}
                titleHighlight={section.highlight}
                onViewAll={() => handleViewAll(i)}
              />

              {isLoading ? (
                <PropertyGridSkeleton />
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
