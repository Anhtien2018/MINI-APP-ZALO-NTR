import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { GoongMap as GoongMapInstance, GoongMarker } from "@goongmaps/goong-js";
import type { ILarkProperty } from "@/types";
import {
  getLarkPropertyCoordinates,
  getLarkPropertyFirstImage,
  getLarkPropertyLocation,
  formatLarkPrice,
  generatePropertySlug,
} from "@/services/api";
import { GOONG_MAPTILES_KEY, ROUTES } from "@/constants";
import { GOONG_MAP_STYLE } from "@/constants/goong";
import { useMapStore } from "@/store";
import { loadGoongJs } from "@/utils/loadGoongJs";
import "./GoongMap.css";

const DEFAULT_CENTER = { lat: 16.0544, lng: 108.2022 };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface MapPoint {
  property: ILarkProperty;
  coords: { lat: number; lng: number };
}

interface Props {
  properties: ILarkProperty[];
}

export function PropertiesGoongMap({ properties }: Props) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoongMapInstance | null>(null);
  const markersRef = useRef<GoongMarker[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    if (!containerRef.current || !GOONG_MAPTILES_KEY) return;
    let cancelled = false;
    // Marker.remove() during cleanup fires the popup's "close" event — skip
    // clearing selectedMarkerId in that case so it survives back navigation.
    let isCleaningUp = false;

    const points: MapPoint[] = properties.flatMap((property) => {
      const coords = getLarkPropertyCoordinates(property);
      return coords ? [{ property, coords }] : [];
    });

    loadGoongJs().then((goongjs) => {
      if (cancelled || !containerRef.current) return;

      goongjs.accessToken = GOONG_MAPTILES_KEY;

      const { selectedMarkerId, mapCenter, mapZoom, setSelectedMarkerId, setMapView } =
        useMapStore.getState();

      const fallbackCenter = points[0]?.coords ?? DEFAULT_CENTER;
      const map = new goongjs.Map({
        container: containerRef.current,
        style: GOONG_MAP_STYLE,
        center: mapCenter ?? [fallbackCenter.lng, fallbackCenter.lat],
        zoom: mapZoom ?? (points.length > 0 ? 14 : 12),
      });
      map.on("error", () => {});
      map.on("moveend", () => {
        const c = map.getCenter();
        setMapView([c.lng, c.lat], map.getZoom());
      });

      markersRef.current = points.map(({ property, coords }) => {
        const image = getLarkPropertyFirstImage(property);
        const location = getLarkPropertyLocation(property);
        const category = property.danh_muc_bds?.name ?? "";
        const transactionType = property.loai_hinh_kinh_doanh_bat_dong_san_dich_vu?.name ?? "";
        const isRental = transactionType.toLowerCase().includes("thuê");
        const price =
          formatLarkPrice(property.gia_cho_thue_gia_ban) +
          (isRental && property.gia_cho_thue_gia_ban ? " / tháng" : "");
        const slug = generatePropertySlug(property.tieu_de, property.lark_record_id);

        const popupEl = document.createElement("div");
        popupEl.className = "goong-popup";
        popupEl.innerHTML = `
          <div class="goong-popup__media">
            ${image ? `<img src="${escapeHtml(image)}" class="goong-popup__img" alt="" />` : ""}
          </div>
          <div class="goong-popup__body">
            <div class="goong-popup__tags">
              ${transactionType ? `<span class="goong-popup__tag goong-popup__tag--type">${escapeHtml(transactionType.toUpperCase())}</span>` : ""}
              ${category ? `<span class="goong-popup__tag goong-popup__tag--category">${escapeHtml(category.toUpperCase())}</span>` : ""}
            </div>
            <p class="goong-popup__title">${escapeHtml(property.tieu_de)}</p>
            <p class="goong-popup__price">${escapeHtml(price)}</p>
            ${
              location
                ? `<div class="goong-popup__location">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#16a34a" style="flex-shrink:0;margin-top:2px">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>${escapeHtml(location)}</span>
                  </div>`
                : ""
            }
          </div>
        `;
        popupEl.addEventListener("click", () => navigateRef.current(ROUTES.DETAIL(slug)));

        const popup = new goongjs.Popup({
          offset: 24,
          maxWidth: "280px",
          className: "property-popup",
        }).setDOMContent(popupEl);

        popup.on("open", () => setSelectedMarkerId(property.id));
        // Skip close events triggered by cleanup so the stored id survives
        // back navigation.
        popup.on("close", () => {
          if (!isCleaningUp) setSelectedMarkerId(null);
        });

        const marker = new goongjs.Marker({ color: "#16a34a" })
          .setLngLat([coords.lng, coords.lat])
          .setPopup(popup)
          .addTo(map);

        return marker;
      });

      // Restore the popup that was open before navigating away — wait for
      // "load" so tiles and markers are fully positioned before opening it.
      if (selectedMarkerId) {
        const idx = points.findIndex((p) => p.property.id === selectedMarkerId);
        if (idx !== -1) {
          map.once("load", () => {
            if (!isCleaningUp) markersRef.current[idx]?.togglePopup();
          });
        }
      }

      if (points.length > 1 && !mapCenter) {
        const bounds = new goongjs.LngLatBounds();
        points.forEach((pt) => bounds.extend([pt.coords.lng, pt.coords.lat]));
        map.fitBounds(bounds, { padding: 48 });
      }

      mapRef.current = map;

      const resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current as HTMLDivElement);
      resizeObserverRef.current = resizeObserver;
    });

    return () => {
      cancelled = true;
      isCleaningUp = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [properties]);

  if (!GOONG_MAPTILES_KEY) {
    return <div className="goong-map__fallback">Thiếu cấu hình Goong Maps API key</div>;
  }

  return <div ref={containerRef} className="goong-map" />;
}
