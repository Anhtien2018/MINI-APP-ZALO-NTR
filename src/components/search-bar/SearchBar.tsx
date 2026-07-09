import React, { useState } from "react";
import { FilterModal } from "@/components/filter-modal/FilterModal";
import { useListingsStore } from "@/store";
import "./SearchBar.css";

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = "Bạn tìm kiếm gì...." }: SearchBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filter = useListingsStore((s) => s.filter);
  const activeText = filter.search || "";

  return (
    <>
      {/* Chỉ còn ô search pill — nút back + thanh trắng ở đỉnh do PageLayout
          dựng (page-topbar), search input được đưa lên nằm ngay trên header. */}
      <div className="zalo-bar__search" onClick={() => setFilterOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7" stroke="#000" strokeWidth="2" />
          <path d="M16.5 16.5L21 21" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span
          className={`zalo-bar__search-text${activeText ? " zalo-bar__search-text--filled" : ""}`}
        >
          {activeText || placeholder}
        </span>
      </div>

      <FilterModal open={filterOpen} onClose={() => setFilterOpen(false)} />
    </>
  );
}
