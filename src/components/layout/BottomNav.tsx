import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants";
import "./BottomNav.css";

interface NavItem {
  label: string;
  path: string;
  icon: (active: boolean) => React.ReactNode;
}

const HomeIcon = ({ active }: { active: boolean }) => {
  const color = active ? "rgba(34,139,34,0.8)" : "rgba(0,0,0,0.7)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 11L12 3l10 8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 10.5V20a1 1 0 001 1h12a1 1 0 001-1V10.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8.7" r="1.8" stroke={color} strokeWidth="1.6" />
      <rect x="9.5" y="14.5" width="5" height="6.5" stroke={color} strokeWidth="1.6" />
    </svg>
  );
};

const GridIcon = ({ active }: { active: boolean }) => {
  const color = active ? "rgba(34,139,34,0.8)" : "rgba(0,0,0,0.7)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.8" />
    </svg>
  );
};

const MapIcon = ({ active }: { active: boolean }) => {
  const color = active ? "rgba(34,139,34,0.8)" : "rgba(0,0,0,0.7)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 12.5 7 12.5s7-7.25 7-12.5c0-3.87-3.13-7-7-7z"
        stroke={color}
        strokeWidth="1.8"
        fill={active ? "#FFF" : "none"}
      />
      <circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.8" />
      <ellipse cx="12" cy="21.5" rx="3" ry="1" stroke={color} strokeWidth="1.5" />
    </svg>
  );
};

const View360Icon = ({ active }: { active: boolean }) => {
  const color = active ? "rgba(34,139,34,0.8)" : "rgba(0,0,0,0.7)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.5" />
      <path
        d="M12 3a13.6 13.6 0 014 9 13.6 13.6 0 01-4 9 13.6 13.6 0 01-4-9 13.6 13.6 0 014-9z"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
};

const HeartIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      stroke={active ? "#e53935" : "rgba(0,0,0,0.7)"}
      strokeWidth="1.8"
      fill={active ? "#ffebee" : "none"}
    />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    label: "Trang chủ",
    path: ROUTES.HOME,
    icon: (active) => <HomeIcon active={active} />,
  },
  {
    label: "Xem nhà",
    path: ROUTES.LISTINGS,
    icon: (active) => <GridIcon active={active} />,
  },
  {
    label: "Bản đồ",
    path: ROUTES.MAP,
    icon: (active) => <MapIcon active={active} />,
  },
  {
    label: "360",
    path: ROUTES.VIEW_360,
    icon: (active) => <View360Icon active={active} />,
  },
  {
    label: "Yêu thích",
    path: ROUTES.FAVORITES,
    icon: (active) => <HeartIcon active={active} />,
  },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ label, path, icon }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            className={`bottom-nav__item${active ? " bottom-nav__item--active" : ""}`}
            onClick={() => navigate(path)}
          >
            {icon(active)}
            <span className="bottom-nav__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
