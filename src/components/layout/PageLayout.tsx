import React, { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { TopSearchBar } from "@/components/search-bar/TopSearchBar";
import { BottomNav } from "./BottomNav";
import "./PageLayout.css";

interface PageLayoutProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
  onBack?: () => void;
}

// `.page-main` is a custom-scrolled <main>, not the window — the browser's
// native scroll restoration on back/forward only tracks window scroll, so we
// have to save/restore it ourselves. Keyed by history entry (location.key),
// which React Router reuses for the same entry on back/forward but mints a
// fresh one for every new push — so a brand new navigation always starts at
// the top, while returning to a previous screen resumes where it left off.
const scrollPositions = new Map<string, number>();

export function PageLayout({ children, hideBottomNav = false, onBack }: PageLayoutProps) {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.scrollTop = scrollPositions.get(location.key) ?? 0;

    const handleScroll = () => {
      scrollPositions.set(location.key, el.scrollTop);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [location.key]);

  const hideSearchBar =
    location.pathname === "/map" ||
    location.pathname === "/search" ||
    location.pathname === "/360" ||
    location.pathname === "/";

  return (
    <div className={`page-layout${hideSearchBar ? " page-layout--no-topbar" : ""}`}>
      {!hideSearchBar && <TopSearchBar onBack={onBack} />}

      <main ref={mainRef} className={`page-main${hideBottomNav ? " page-main--no-nav" : ""}`}>
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
