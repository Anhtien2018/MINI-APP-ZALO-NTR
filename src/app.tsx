import { ROUTES } from "@/constants";
import { FavoritesPage } from "@/pages/favorites/FavoritesPage";
import { HomePage } from "@/pages/home/HomePage";
import { DetailPage } from "@/pages/listings/DetailPage";
import { ListingsPage } from "@/pages/listings/ListingsPage";
import { MapPage } from "@/pages/map/MapPage";
import { SearchPage } from "@/pages/search/SearchPage";
import { View360Page } from "@/pages/view360/View360Page";
import {
  getBedroomAmenities,
  getBusinessTypes,
  getCities,
  getDistricts,
  getExternalAmenities,
  getHomeConfiguration,
  getMainDirections,
  getOtherApartmentAmenities,
  getPriceRanges,
  getPropertyCategories,
  getWards,
  getWebConfiguration,
} from "@/services/api";
import { useAppStore } from "@/store";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./app.css";

const SPLASH_PARTICLES: { size: number; top: string; left: string; delay: number; dur: number }[] = [
  { size: 5, top: "12%", left: "10%", delay: 0, dur: 4.2 },
  { size: 4, top: "18%", left: "82%", delay: 0.6, dur: 5 },
  { size: 7, top: "72%", left: "7%", delay: 1.1, dur: 3.8 },
  { size: 4, top: "78%", left: "88%", delay: 0.3, dur: 4.6 },
  { size: 3, top: "45%", left: "4%", delay: 0.9, dur: 4 },
  { size: 5, top: "38%", left: "93%", delay: 1.4, dur: 5.2 },
  { size: 6, top: "88%", left: "52%", delay: 0.5, dur: 3.6 },
  { size: 3, top: "8%", left: "48%", delay: 1.7, dur: 4.4 },
  { size: 4, top: "60%", left: "20%", delay: 0.2, dur: 4.8 },
  { size: 3, top: "25%", left: "65%", delay: 1.3, dur: 3.9 },
];

function SplashScreen() {
  const {
    setWebConfig,
    setHomeConfig,
    setBusinessTypes,
    setPropertyCategories,
    setCities,
    setDistricts,
    setWards,
    setPriceRanges,
    setMainDirections,
    setOtherApartmentAmenities,
    setExternalAmenities,
    setBedroomAmenities,
    setHydrated,
  } = useAppStore();

  useEffect(() => {
    Promise.all([
      getWebConfiguration().then(setWebConfig),
      getHomeConfiguration().then(setHomeConfig),
      getBusinessTypes().then(setBusinessTypes),
      getPropertyCategories().then(setPropertyCategories),
      getCities().then(setCities),
      getDistricts().then(setDistricts),
      getWards().then(setWards),
      getPriceRanges().then(setPriceRanges),
      getMainDirections()
        .then(setMainDirections)
        .catch(() => {}),
      getOtherApartmentAmenities()
        .then(setOtherApartmentAmenities)
        .catch(() => {}),
      getExternalAmenities()
        .then(setExternalAmenities)
        .catch(() => {}),
      getBedroomAmenities()
        .then(setBedroomAmenities)
        .catch(() => {}),
    ])
      .catch(console.error)
      .finally(() => setHydrated(true));
  }, []);

  return (
    <div className="splash">
      {SPLASH_PARTICLES.map((p, i) => (
        <div
          key={i}
          className="splash__particle"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <div className="splash__grid" />
      <div className="splash__glow" />

      <div className="splash__radar">
        <div className="splash__ring splash__ring--1" />
        <div className="splash__ring splash__ring--2" />
        <div className="splash__ring splash__ring--3" />
        <div className="splash__crosshair-h" />
        <div className="splash__crosshair-v" />
        <div className="splash__sweep-wrap" />

        <div className="splash__icon">
          <svg width="34" height="34" viewBox="0 0 60 60" fill="none">
            <path d="M15 42V24l15-9 15 9v18H35V30h-10v12H15z" fill="white" fillOpacity="0.95" />
          </svg>
        </div>
      </div>

      <div className="splash__bars">
        {[0, 1, 2].map((i) => (
          <div key={i} className="splash__bar" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>

      <div className="splash__sweep-light" />
    </div>
  );
}

function AppContent() {
  const isHydrated = useAppStore((s) => s.isHydrated);

  if (!isHydrated) return <SplashScreen />;

  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.LISTINGS} element={<ListingsPage />} />
      <Route path={ROUTES.SEARCH} element={<SearchPage />} />
      <Route path="/listings/:slug" element={<DetailPage />} />
      <Route path={ROUTES.MAP} element={<MapPage />} />
      <Route path={ROUTES.VIEW_360} element={<View360Page />} />
      <Route path={ROUTES.FAVORITES} element={<FavoritesPage />} />
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
