import React, { useState, useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
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
import { useLarkPropertiesMap } from "@/hooks/useListingsQueries";
import { PropertiesGoongMap } from "@/components/goong-map/PropertiesGoongMap";
import "./MapPage.css";

function MapFilterSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="map-search__select-wrap">
      <select className="map-search__select" {...props} />
      <svg
        className="map-search__select-arrow"
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

export function MapPage() {
  const { data: webConfig } = useWebConfig();
  const { data: businessTypes = [] } = useBusinessTypes();
  const { data: propertyCategories = [] } = usePropertyCategories();
  const { data: cities = [] } = useCities();
  const { data: districts = [] } = useDistricts();
  const filter = useListingsStore((s) => s.filter);
  const setFilter = useListingsStore((s) => s.setFilter);
  const filtersOpen = useListingsStore((s) => s.filtersOpen);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const statusActive = webConfig?.status_properties?.active ?? undefined;
  const districtOptions = filter.city ? districts.filter((d) => d.province_id === filter.city) : [];

  const { data, isFetching } = useLarkPropertiesMap({
    status: statusActive,
    transactionType: filter.transactionType || undefined,
    propertyType: filter.propertyType || undefined,
    city: filter.city || undefined,
    district: filter.district || undefined,
    search: filter.search || undefined,
    priceRange: filter.priceRange || undefined,
    features: filter.features?.length ? filter.features : undefined,
  });
  const properties = data?.data ?? [];

  const propertiesWithCoords = useMemo(
    () =>
      (data?.data ?? []).filter((p) => {
        const viTri = p.vi_tri ?? p.duong_khu_dan_cu_neu_khong_co_de_trong;
        return !!viTri?.location;
      }),
    [data],
  );

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
      <div className="map-page">
        <div className="map-search">
          <QuickFilterBar />

          {filtersOpen && (
            <>
              <div className="map-search__row">
                <MapFilterSelect
                  value={filter.city}
                  onChange={(e) => setFilter({ city: e.target.value, district: "" })}
                >
                  <option value="">Tỉnh/ Thành phố</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </MapFilterSelect>

                <MapFilterSelect
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
                </MapFilterSelect>
              </div>

              <div className="map-search__row">
                <MapFilterSelect
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
                </MapFilterSelect>

                <MapFilterSelect
                  value={filter.propertyType}
                  onChange={(e) => setFilter({ propertyType: e.target.value })}
                >
                  <option value="">Loại BĐS</option>
                  {propertyCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </MapFilterSelect>
              </div>

              <div className="map-search__row map-search__row--bottom">
                <button className="map-search__advanced-btn" onClick={() => setAdvancedOpen(true)}>
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
                    className="map-search__clear-btn"
                    onClick={() => useListingsStore.getState().resetFilter()}
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="map-page__map">
          {!isFetching ? (
            <PropertiesGoongMap properties={propertiesWithCoords} />
          ) : (
            <div className="map-page__map-skeleton skeleton-pulse" />
          )}
        </div>
      </div>

      <FilterModal open={advancedOpen} onClose={() => setAdvancedOpen(false)} />
    </PageLayout>
  );
}
