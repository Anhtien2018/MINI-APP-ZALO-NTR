import React, { useState, useEffect } from "react";
import { useListingsStore } from "@/store";
import "./QuickFilterBar.css";

interface QuickFilterBarProps {
  placeholder?: string;
}

export function QuickFilterBar({
  placeholder = "Tìm khu vực, dự án, loại...",
}: QuickFilterBarProps) {
  const filter = useListingsStore((s) => s.filter);
  const filtersOpen = useListingsStore((s) => s.filtersOpen);
  const toggleFiltersOpen = useListingsStore((s) => s.toggleFiltersOpen);
  const [searchText, setSearchText] = useState(filter.search);

  // Keep the input in sync when search is cleared/changed from elsewhere
  // (e.g. "Xóa bộ lọc"), but not while this debounces its own edits.
  useEffect(() => {
    setSearchText(filter.search);
  }, [filter.search]);

  return (
    <div className="quick-filter-bar">
      <div className="quick-filter-bar__input-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7" stroke="#999" strokeWidth="2" />
          <path d="M16.5 16.5L21 21" stroke="#999" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          className="quick-filter-bar__input"
          placeholder={placeholder}
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            useListingsStore.getState().setSearch(e.target.value);
          }}
        />
      </div>

      <button
        className={`quick-filter-bar__tune-btn${filtersOpen ? " quick-filter-bar__tune-btn--active" : ""}`}
        onClick={toggleFiltersOpen}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <line
            x1="4"
            y1="6"
            x2="20"
            y2="6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="12"
            x2="20"
            y2="12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="18"
            x2="20"
            y2="18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle
            cx="9"
            cy="6"
            r="2"
            className="quick-filter-bar__tune-dot"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle
            cx="16"
            cy="12"
            r="2"
            className="quick-filter-bar__tune-dot"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle
            cx="11"
            cy="18"
            r="2"
            className="quick-filter-bar__tune-dot"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      </button>
    </div>
  );
}
