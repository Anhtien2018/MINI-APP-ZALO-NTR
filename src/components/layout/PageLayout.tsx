import React from "react";
import { BottomNav } from "./BottomNav";
import "./PageLayout.css";

interface PageLayoutProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
  headerTitle?: string;
  onBack?: () => void;
}

export function PageLayout({ children, hideBottomNav = false, headerTitle, onBack }: PageLayoutProps) {
  return (
    <div className="page-layout">
      {headerTitle && (
        <header className="page-header">
          {onBack && (
            <button className="page-header__back" onClick={onBack}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 5l-7 7 7 7" stroke="#111" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <span className="page-header__title">{headerTitle}</span>
        </header>
      )}
      <main className={`page-main${hideBottomNav ? " page-main--no-nav" : ""}`}>
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
