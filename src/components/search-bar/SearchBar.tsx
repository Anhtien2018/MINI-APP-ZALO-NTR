import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "zmp-ui";
import { FilterModal } from "@/components/filter-modal/FilterModal";
import { useListingsStore } from "@/store";
import "./SearchBar.css";

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = "Bạn tìm kiếm gì...." }: SearchBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();
  const filter = useListingsStore((s) => s.filter);
  const activeText = filter.search || "";

  return (
    <>
      {/* Invisible spacer reserving the safe-area-top + right-side zone that
          Zalo's native Mini App control (the floating "..."/close buttons) sits in,
          so it never visually overlaps the custom bar below. */}

      <div className="zalo-bar">
        {/* Back button */}
        <button className="zalo-bar__back" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#333"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Search input pill */}
        <div className="zalo-bar__search" onClick={() => setFilterOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" stroke="#999" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="#999" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span
            className={`zalo-bar__search-text${activeText ? " zalo-bar__search-text--filled" : ""}`}
          >
            {activeText || placeholder}
          </span>
        </div>
        <Header showBackIcon={false} title="" className="zalo-bar__zaui-spacer" />
      </div>

      <FilterModal open={filterOpen} onClose={() => setFilterOpen(false)} />
    </>
  );
}
