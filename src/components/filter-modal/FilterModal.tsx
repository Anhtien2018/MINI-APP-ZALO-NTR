import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useListingsStore, EMPTY_FILTER, type ListingsFilter } from "@/store";
import {
  useBusinessTypes,
  useCities,
  useDistricts,
  useExternalAmenities,
  useOtherApartmentAmenities,
  useBedroomAmenities,
  usePropertyCategories,
  usePriceRanges,
} from "@/hooks/useConfigQueries";
import { ROUTES } from "@/constants";
import "./FilterModal.css";

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
}

export function FilterModal({ open, onClose }: FilterModalProps) {
  const navigate = useNavigate();
  const globalFilter = useListingsStore((s) => s.filter);
  const setGlobalFilter = useListingsStore((s) => s.setFilter);

  const { data: businessTypes = [] } = useBusinessTypes();
  const { data: propertyCategories = [] } = usePropertyCategories();
  const { data: cities = [] } = useCities();
  const { data: districts = [] } = useDistricts();
  const { data: otherApartmentAmenities = [] } = useOtherApartmentAmenities();
  const { data: externalAmenities = [] } = useExternalAmenities();
  const { data: bedroomAmenities = [] } = useBedroomAmenities();
  const { data: priceRanges = [] } = usePriceRanges();

  const [draft, setDraft] = useState<ListingsFilter>({ ...globalFilter });
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setDraft({ ...globalFilter });
    }
    // Only re-sync when the modal transitions open — re-running this on every
    // globalFilter change (e.g. the live debounced search below) would wipe
    // out other in-progress draft edits the user hasn't submitted yet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const districtOptions = draft.city ? districts.filter((d) => d.province_id === draft.city) : [];

  const allAmenities = [...otherApartmentAmenities, ...externalAmenities, ...bedroomAmenities];
  const visibleAmenities = amenitiesExpanded ? allAmenities : allAmenities.slice(0, 8);

  const toggleFeature = (id: string) => {
    const cur = draft.features ?? [];
    setDraft({
      ...draft,
      features: cur.includes(id) ? cur.filter((f) => f !== id) : [...cur, id],
    });
  };

  const handleReset = () => {
    setDraft({ ...EMPTY_FILTER });
  };

  const handleSearch = () => {
    setGlobalFilter(draft);
    onClose();
    navigate(ROUTES.SEARCH);
  };

  const activeFeatureCount =
    (draft.transactionType ? 1 : 0) +
    (draft.propertyType ? 1 : 0) +
    (draft.city ? 1 : 0) +
    (draft.district ? 1 : 0) +
    (draft.priceRange ? 1 : 0) +
    (draft.features?.length ?? 0);

  return (
    <div className="filter-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="filter-sheet" ref={sheetRef}>
        <div className="filter-sheet__header">
          <span className="filter-sheet__title">Tìm kiếm</span>
          <button className="filter-sheet__close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#666" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="filter-sheet__body">
          {/* Từ khóa */}
          <div className="filter-field">
            <label className="filter-label">Từ khóa tìm kiếm</label>
            <input
              className="filter-input"
              placeholder="Nhập tên bất động sản..."
              value={draft.search}
              onChange={(e) => {
                const value = e.target.value;
                setDraft({ ...draft, search: value });
                useListingsStore.getState().setSearch(value);
              }}
            />
          </div>

          {/* Loại giao dịch + Loại tài sản */}
          <div className="filter-row-2">
            <div className="filter-field">
              <label className="filter-label">Loại Giao dịch</label>
              <div className="filter-select-wrap">
                <select
                  className="filter-select filter-select--capitalize"
                  value={draft.transactionType}
                  onChange={(e) =>
                    setDraft({ ...draft, transactionType: e.target.value, propertyType: "" })
                  }
                >
                  <option value="">Giao dịch</option>
                  {businessTypes.map((t) => {
                    const s = t.name.toLowerCase();
                    return (
                      <option key={t.id} value={t.id}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    );
                  })}
                </select>
                <svg
                  className="filter-select__arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M6 9l6 6 6-6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="filter-field">
              <label className="filter-label">Loại BĐS</label>
              <div className="filter-select-wrap">
                <select
                  className="filter-select"
                  value={draft.propertyType}
                  onChange={(e) => setDraft({ ...draft, propertyType: e.target.value })}
                >
                  <option value="">Loại BĐS</option>
                  {propertyCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="filter-select__arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M6 9l6 6 6-6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tỉnh/Thành + Xã/Phường */}
          <div className="filter-row-2">
            <div className="filter-field">
              <label className="filter-label">Tỉnh/Thành</label>
              <div className="filter-select-wrap">
                <select
                  className={`filter-select${!draft.city ? " filter-select--placeholder" : ""}`}
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value, district: "" })}
                >
                  <option value="">Tỉnh/Thành</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="filter-select__arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M6 9l6 6 6-6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="filter-field">
              <label className="filter-label">Xã/Phường</label>
              <div
                className={`filter-select-wrap${!draft.city ? " filter-select-wrap--disabled" : ""}`}
              >
                <select
                  className={`filter-select${!draft.district ? " filter-select--placeholder" : ""}`}
                  value={draft.district}
                  disabled={!draft.city || districtOptions.length === 0}
                  onChange={(e) => setDraft({ ...draft, district: e.target.value })}
                >
                  <option value="">Xã/Phường</option>
                  {districtOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="filter-select__arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M6 9l6 6 6-6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Khoảng giá */}
          <div className="filter-field">
            <label className="filter-label">Khoảng giá</label>
            <div className="filter-select-wrap">
              <select
                className={`filter-select${!draft.priceRange ? " filter-select--placeholder" : ""}`}
                value={draft.priceRange}
                onChange={(e) => setDraft({ ...draft, priceRange: e.target.value })}
              >
                <option value="">Chọn khoảng giá</option>
                {priceRanges.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <svg className="filter-select__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Tiện ích */}
          {allAmenities.length > 0 && (
            <div className="filter-field">
              <div className="filter-amenities-header">
                <label className="filter-label">Tiện ích</label>
                <button
                  className="filter-amenities-toggle"
                  onClick={() => setAmenitiesExpanded((v) => !v)}
                >
                  {amenitiesExpanded ? "Thu gọn" : "Xem thêm"}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{
                      transform: amenitiesExpanded ? "rotate(-90deg)" : "rotate(90deg)",
                      transition: "transform 0.2s",
                    }}
                  >
                    <path
                      d="M9 18l6-6-6-6"
                      stroke="#ff6b35"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              {amenitiesExpanded && (
                <div className="filter-amenities-list">
                  {allAmenities.map((a) => (
                    <label
                      key={a.id}
                      className="filter-checkbox-row"
                      onClick={() => toggleFeature(a.id)}
                    >
                      <div
                        className={`filter-checkbox${(draft.features ?? []).includes(a.id) ? " filter-checkbox--checked" : ""}`}
                      >
                        {(draft.features ?? []).includes(a.id) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M5 13l4 4L19 7"
                              stroke="#fff"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="filter-checkbox-label">{a.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="filter-sheet__footer">
          <button className="filter-sheet__reset" onClick={handleReset}>
            Đặt lại
          </button>
          <button className="filter-sheet__search" onClick={handleSearch}>
            {activeFeatureCount > 0 && (
              <span className="filter-sheet__count">{activeFeatureCount}</span>
            )}
            Tìm kiếm
          </button>
        </div>
      </div>
    </div>
  );
}
