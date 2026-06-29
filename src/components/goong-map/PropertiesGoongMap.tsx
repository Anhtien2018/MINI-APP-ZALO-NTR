import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { GoongMap as GoongMapInstance, GoongMarker } from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
import type { ILarkProperty } from "@/types";
import {
  getLarkPropertyCoordinates,
  getLarkPropertyFirstImage,
  formatLarkPrice,
  generatePropertySlug,
} from "@/services/api";
import { GOONG_MAPTILES_KEY, ROUTES } from "@/constants";
import { GOONG_MAP_STYLE } from "@/constants/goong";
import "./GoongMap.css";

const DEFAULT_CENTER = { lat: 16.0544, lng: 108.2022 };

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

    const points: MapPoint[] = properties.flatMap((property) => {
      const coords = getLarkPropertyCoordinates(property);
      return coords ? [{ property, coords }] : [];
    });

    import("@goongmaps/goong-js").then(({ default: goongjs }) => {
      if (cancelled || !containerRef.current) return;

      goongjs.accessToken = GOONG_MAPTILES_KEY;
      const fallbackCenter = points[0]?.coords ?? DEFAULT_CENTER;
      const map = new goongjs.Map({
        container: containerRef.current,
        style: GOONG_MAP_STYLE,
        center: [fallbackCenter.lng, fallbackCenter.lat],
        zoom: points.length > 0 ? 14 : 12,
      });
      map.on("error", () => {});

      markersRef.current = points.map(({ property, coords }) => {
        const image = getLarkPropertyFirstImage(property);
        const price = formatLarkPrice(property.gia_cho_thue_gia_ban);
        const slug = generatePropertySlug(property.tieu_de, property.lark_record_id);

        const popupEl = document.createElement("div");
        popupEl.className = "goong-popup";
        popupEl.innerHTML = `
          ${image ? `<img src="${image}" class="goong-popup__img" alt="" />` : ""}
          <div class="goong-popup__body">
            <p class="goong-popup__title">${property.tieu_de}</p>
            <p class="goong-popup__price">${price}</p>
          </div>
        `;
        popupEl.addEventListener("click", () => navigateRef.current(ROUTES.DETAIL(slug)));

        const popup = new goongjs.Popup({ offset: 24, maxWidth: "240px" }).setDOMContent(popupEl);

        const marker = new goongjs.Marker({ color: "#16a34a" })
          .setLngLat([coords.lng, coords.lat])
          .setPopup(popup)
          .addTo(map);

        return marker;
      });

      if (points.length > 1) {
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
