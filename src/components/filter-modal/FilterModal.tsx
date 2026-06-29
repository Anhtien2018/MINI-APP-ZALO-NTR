import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore, useListingsStore, EMPTY_FILTER, type ListingsFilter } from "@/store";
import { ROUTES } from "@/constants";
import "./FilterModal.css";

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
}

const BEDROOM_OPTIONS = ["1", "2", "3", "4", "5+"];
const PRICE_MAX = 50;
const AREA_MAX = 500;

function DualRangeSlider({
  min, max, step, valueMin, valueMax, unit,
  onChange,
}: {
  min: number; max: number; step: number;
  valueMin: number; valueMax: number; unit: string;
  onChange: (min: number, max: number) => void;
}) {
  const rangeRef = useRef<HTMLDivElement>(null);

  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const left = pct(valueMin);
  const right = pct(valueMax);

  const trackStyle = {
    background: `linear-gradient(to right, #e5e7eb ${left}%, #228b22 ${left}%, #228b22 ${right}%, #e5e7eb ${right}%)`,
  };

  const formatVal = (v: number) =>
    unit === "tỷ"
      ? v === 0 ? "0" : `${v} tỷ`
      : v === 0 ? "0 m²" : `${v} m²`;

  return (
    <div className="dual-slider">
      <div className="dual-slider__labels">
        <span className="dual-slider__val">{formatVal(valueMin)}</span>
        <span className="dual-slider__val">{formatVal(valueMax)}</span>
      </div>
      <div className="dual-slider__track-wrap" ref={rangeRef}>
        <div className="dual-slider__track" style={trackStyle} />
        <input
          type="range" min={min} max={max} step={step}
          value={valueMin}
          className="dual-slider__input dual-slider__input--min"
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v < valueMax) onChange(v, valueMax);
          }}
        />
        <input
          type="range" min={min} max={max} step={step}
          value={valueMax}
          className="dual-slider__input dual-slider__input--max"
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v > valueMin) onChange(valueMin, v);
          }}
        />
      </div>
    </div>
  );
}

export function FilterModal({ open, onClose }: FilterModalProps) {
  const navigate = useNavigate();
  const globalFilter = useListingsStore((s) => s.filter);
  const setGlobalFilter = useListingsStore((s) => s.setFilter);

  const businessTypes = useAppStore((s) => s.businessTypes);
  const propertyCategories = useAppStore((s) => s.propertyCategories);
  const cities = useAppStore((s) => s.cities);
  const districts = useAppStore((s) => s.districts);
  const priceRanges = useAppStore((s) => s.priceRanges);
  const mainDirections = useAppStore((s) => s.mainDirections);
  const otherApartmentAmenities = useAppStore((s) => s.otherApartmentAmenities);
  const externalAmenities = useAppStore((s) => s.externalAmenities);
  const bedroomAmenities = useAppStore((s) => s.bedroomAmenities);

  const [draft, setDraft] = useState<ListingsFilter>({ ...globalFilter });
  const [bedrooms, setBedrooms] = useState<string[]>([]);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [areaMin, setAreaMin] = useState(0);
  const [areaMax, setAreaMax] = useState(AREA_MAX);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setDraft({ ...globalFilter });
      setBedrooms([]);
      setPriceMin(0); setPriceMax(PRICE_MAX);
      setAreaMin(0); setAreaMax(AREA_MAX);
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
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const districtOptions = draft.city
    ? districts.filter((d) => d.province_id === draft.city)
    : [];

  const allAmenities = [
    ...otherApartmentAmenities,
    ...externalAmenities,
    ...bedroomAmenities,
  ];
  const visibleAmenities = amenitiesExpanded ? allAmenities : allAmenities.slice(0, 8);

  const toggleFeature = (id: string) => {
    const cur = draft.features ?? [];
    setDraft({
      ...draft,
      features: cur.includes(id) ? cur.filter((f) => f !== id) : [...cur, id],
    });
  };

  const toggleBedroom = (v: string) => {
    setBedrooms((prev) => (prev.includes(v) ? [] : [v]));
  };

  const handleReset = () => {
    setDraft({ ...EMPTY_FILTER });
    setBedrooms([]);
    setPriceMin(0); setPriceMax(PRICE_MAX);
    setAreaMin(0); setAreaMax(AREA_MAX);
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
    (priceMin > 0 || priceMax < PRICE_MAX ? 1 : 0) +
    (areaMin > 0 || areaMax < AREA_MAX ? 1 : 0) +
    (draft.features?.length ?? 0) +
    bedrooms.length;

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
                  onChange={(e) => setDraft({ ...draft, transactionType: e.target.value, propertyType: "" })}
                >
                  <option value="">Giao dịch</option>
                  {businessTypes.map((t) => {
                    const s = t.name.toLowerCase();
                    return <option key={t.id} value={t.id}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>;
                  })}
                </select>
                <svg className="filter-select__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="filter-field">
              <label className="filter-label">Loại tài sản</label>
              <div className="filter-select-wrap">
                <select
                  className="filter-select"
                  value={draft.propertyType}
                  onChange={(e) => setDraft({ ...draft, propertyType: e.target.value })}
                >
                  <option value="">Tài sản</option>
                  {propertyCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <svg className="filter-select__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
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
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <svg className="filter-select__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="filter-field">
              <label className="filter-label">Xã/Phường</label>
              <div className={`filter-select-wrap${!draft.city ? " filter-select-wrap--disabled" : ""}`}>
                <select
                  className={`filter-select${!draft.district ? " filter-select--placeholder" : ""}`}
                  value={draft.district}
                  disabled={!draft.city || districtOptions.length === 0}
                  onChange={(e) => setDraft({ ...draft, district: e.target.value })}
                >
                  <option value="">Xã/Phường</option>
                  {districtOptions.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <svg className="filter-select__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Khoảng giá */}
          <div className="filter-field">
            <span className="filter-label">Khoảng giá</span>
            <DualRangeSlider
              min={0} max={PRICE_MAX} step={1}
              valueMin={priceMin} valueMax={priceMax} unit="tỷ"
              onChange={(mn, mx) => { setPriceMin(mn); setPriceMax(mx); }}
            />
          </div>

          {/* Diện tích */}
          <div className="filter-field">
            <span className="filter-label">Diện tích</span>
            <DualRangeSlider
              min={0} max={AREA_MAX} step={10}
              valueMin={areaMin} valueMax={areaMax} unit="m²"
              onChange={(mn, mx) => { setAreaMin(mn); setAreaMax(mx); }}
            />
          </div>

          {/* Hướng */}
          {mainDirections.length > 0 && (
            <div className="filter-field">
              <label className="filter-label">Hướng</label>
              <div className="filter-select-wrap">
                <select className="filter-select filter-select--placeholder" defaultValue="">
                  <option value="">Chọn hướng</option>
                  {mainDirections.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <svg className="filter-select__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          )}

          {/* Số phòng ngủ */}
          <div className="filter-field">
            <label className="filter-label">Số phòng ngủ</label>
            <div className="filter-bedroom-row">
              {BEDROOM_OPTIONS.map((v) => (
                <button
                  key={v}
                  className={`filter-bedroom-btn${bedrooms.includes(v) ? " filter-bedroom-btn--active" : ""}`}
                  onClick={() => toggleBedroom(v)}
                >
                  {v}
                </button>
              ))}
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
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    style={{ transform: amenitiesExpanded ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 0.2s" }}
                  >
                    <path d="M9 18l6-6-6-6" stroke="#ff6b35" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              {amenitiesExpanded && (
                <div className="filter-amenities-list">
                  {allAmenities.map((a) => (
                    <label key={a.id} className="filter-checkbox-row" onClick={() => toggleFeature(a.id)}>
                      <div className={`filter-checkbox${(draft.features ?? []).includes(a.id) ? " filter-checkbox--checked" : ""}`}>
                        {(draft.features ?? []).includes(a.id) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
