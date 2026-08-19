import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  GoongMap as GoongMapInstance,
  GoongMarker,
  GoongGeoJSONPolygonFeature,
} from "@goongmaps/goong-js";
import type { ILarkProperty } from "@/types";
import {
  getLarkPropertiesPaginated,
  getLarkPropertyCoordinates,
  getLarkPropertyFirstImage,
  getLarkPropertyLocation,
  formatLarkPrice,
  generatePropertySlug,
  type IListingsFilter,
} from "@/services/api";
import { GOONG_MAPTILES_KEY, ROUTES } from "@/constants";
import { GOONG_MAP_STYLE } from "@/constants/goong";
import { useMapStore } from "@/store";
import { loadGoongJs } from "@/utils/loadGoongJs";
import { isPointInPolygon, type LatLng } from "@/lib/utils/geometry";
import "./GoongMap.css";

const DEFAULT_CENTER = { lat: 16.0544, lng: 108.2022 };
const LASSO_SOURCE_ID = "lasso-area";
const LASSO_FILL_LAYER_ID = "lasso-area-fill";
const MIN_DRAG_BOUNDING_BOX_PX = 24;

// A lasso match can fall outside the map's own initial (capped) fetch — see
// the area re-fetch in onPolygonDrawn below — so building a goong-js
// Marker+Popup for every match doesn't scale (a lasso at low zoom can easily
// match hundreds of properties). Caps how many extra markers actually get
// created; matchCount in the status banner stays uncapped/accurate.
const AREA_RENDER_LIMIT = 100;

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

export interface AreaSelectStatus {
  loading: boolean;
  error: boolean;
  matchCount: number | null;
  renderedCount: number | null;
}

const IDLE_AREA_STATUS: AreaSelectStatus = {
  loading: false,
  error: false,
  matchCount: null,
  renderedCount: null,
};

interface Props {
  properties: ILarkProperty[];
  filter: IListingsFilter;
}

export function PropertiesGoongMap({ properties, filter }: Props) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoongMapInstance | null>(null);
  const markersRef = useRef<GoongMarker[]>([]);
  // Markers for area-matched properties that fall outside the base
  // `properties` set (the map's initial fetch is capped — see MapPage).
  // Keyed by property id so a redraw can be diffed/rebuilt cleanly.
  const extraMarkersRef = useRef<Map<string, GoongMarker>>(new Map());
  // Set once the base map/markers effect has loaded goong-js, so
  // onPolygonDrawn (a plain handler outside that effect) can build markers
  // for area-matched properties the same way — popup, click nav, etc.
  const createMarkerRef = useRef<
    ((property: ILarkProperty, coords: LatLng) => GoongMarker) | null
  >(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const navigateRef = useRef(navigate);
  const filterRef = useRef(filter);
  const polylineRef = useRef<SVGPolylineElement | null>(null);
  const drawPointsRef = useRef<{ x: number; y: number }[]>([]);
  const pointsRef = useRef<MapPoint[]>([]);
  // Bumped on every draw gesture; a response only applies if it's still the
  // most recent one requested — guards against a slower fetch resolving
  // after a newer polygon has already been drawn.
  const areaRequestIdRef = useRef(0);
  const [drawMode, setDrawMode] = useState<"idle" | "drawing" | "active">("idle");
  const [areaStatus, setAreaStatus] = useState<AreaSelectStatus>(IDLE_AREA_STATUS);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    setDrawMode("idle");
    setAreaStatus(IDLE_AREA_STATUS);
  }, [properties]);

  function getRelativePoint(e: React.PointerEvent<SVGSVGElement>): { x: number; y: number } {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function updatePolyline() {
    if (!polylineRef.current) return;
    polylineRef.current.setAttribute(
      "points",
      drawPointsRef.current.map((p) => `${p.x},${p.y}`).join(" "),
    );
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawPointsRef.current = [getRelativePoint(e)];
    updatePolyline();
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (drawPointsRef.current.length === 0) return;
    drawPointsRef.current.push(getRelativePoint(e));
    updatePolyline();
  }

  function isMeaningfulDrag(pts: { x: number; y: number }[]): boolean {
    if (pts.length < 3) return false;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    return width >= MIN_DRAG_BOUNDING_BOX_PX && height >= MIN_DRAG_BOUNDING_BOX_PX;
  }

  function renderPolygonLayer(map: GoongMapInstance, polygon: LatLng[]) {
    const feature: GoongGeoJSONPolygonFeature = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [polygon.map((p) => [p.lng, p.lat])] },
    };
    const existingSource = map.getSource(LASSO_SOURCE_ID);
    if (existingSource) {
      existingSource.setData(feature);
      return;
    }
    map.addSource(LASSO_SOURCE_ID, { type: "geojson", data: feature });
    map.addLayer({
      id: LASSO_FILL_LAYER_ID,
      type: "fill",
      source: LASSO_SOURCE_ID,
      paint: { "fill-color": "#16a34a", "fill-opacity": 0.15 },
    });
  }

  function clearPolygonLayer(map: GoongMapInstance) {
    if (map.getLayer(LASSO_FILL_LAYER_ID)) map.removeLayer(LASSO_FILL_LAYER_ID);
    if (map.getSource(LASSO_SOURCE_ID)) map.removeSource(LASSO_SOURCE_ID);
  }

  // Map's own load is capped (see MapPage's useLarkPropertiesMap, limit:
  // 100), so a polygon drawn over a broad area can easily match properties
  // that were never fetched at all. Directus has no bbox/geo query support
  // for the map's plain "lng,lat" string field, so this re-fetches every row
  // matching the active filters (limit: -1) and runs the point-in-polygon
  // test client-side, instead of trusting only the markers already on-screen.
  async function onPolygonDrawn(map: GoongMapInstance, polygon: LatLng[]) {
    const pts = pointsRef.current;
    if (markersRef.current.length !== pts.length) {
      setDrawMode("idle");
      setAreaStatus(IDLE_AREA_STATUS);
      return;
    }
    renderPolygonLayer(map, polygon);
    setDrawMode("active");
    setAreaStatus({ loading: true, error: false, matchCount: null, renderedCount: null });

    const requestId = ++areaRequestIdRef.current;
    try {
      const res = await getLarkPropertiesPaginated({ ...filterRef.current, page: 1, limit: -1 });
      if (requestId !== areaRequestIdRef.current) return;

      const matched = res.data.filter((property) => {
        const coords = getLarkPropertyCoordinates(property);
        return coords ? isPointInPolygon(coords, polygon) : false;
      });
      const basePropertyIds = new Set(pts.map((p) => p.property.id));
      const matchedIds = new Set(matched.map((p) => p.id));

      let renderedCount = 0;
      markersRef.current.forEach((marker, idx) => {
        const inside = matchedIds.has(pts[idx].property.id);
        marker.getElement().style.display = inside ? "" : "none";
        if (inside) renderedCount += 1;
      });

      // Rebuilt from scratch on every successful draw rather than
      // diffed/reused: lasso redraws are infrequent, and this avoids
      // tracking which extras are still valid across a filter change.
      extraMarkersRef.current.forEach((marker) => marker.remove());
      extraMarkersRef.current.clear();
      const buildMarker = createMarkerRef.current;
      if (buildMarker) {
        for (const property of matched) {
          if (renderedCount >= AREA_RENDER_LIMIT) break;
          if (basePropertyIds.has(property.id)) continue;
          const coords = getLarkPropertyCoordinates(property);
          if (!coords) continue;
          extraMarkersRef.current.set(property.id, buildMarker(property, coords));
          renderedCount += 1;
        }
      }

      setAreaStatus({
        loading: false,
        error: false,
        matchCount: matched.length,
        renderedCount,
      });
    } catch (err) {
      if (requestId !== areaRequestIdRef.current) return;
      console.error("[onPolygonDrawn] failed to fetch area listings:", err);
      clearPolygonLayer(map);
      markersRef.current.forEach((marker) => {
        marker.getElement().style.display = "";
      });
      extraMarkersRef.current.forEach((marker) => marker.remove());
      extraMarkersRef.current.clear();
      setDrawMode("idle");
      setAreaStatus({ loading: false, error: true, matchCount: null, renderedCount: null });
    }
  }

  function clearSelection() {
    const map = mapRef.current;
    if (map) clearPolygonLayer(map);
    markersRef.current.forEach((marker) => {
      marker.getElement().style.display = "";
    });
    extraMarkersRef.current.forEach((marker) => marker.remove());
    extraMarkersRef.current.clear();
    setDrawMode("idle");
    setAreaStatus(IDLE_AREA_STATUS);
  }

  function handlePointerUp() {
    const pts = drawPointsRef.current;
    drawPointsRef.current = [];
    updatePolyline();

    const map = mapRef.current;
    map?.dragPan.enable();
    map?.touchZoomRotate.enable();

    if (!map || !isMeaningfulDrag(pts)) {
      setDrawMode("idle");
      return;
    }

    const polygon: LatLng[] = pts.map((pt) => {
      const ll = map.unproject(pt);
      return { lat: ll.lat, lng: ll.lng };
    });
    onPolygonDrawn(map, polygon);
  }

  function handlePointerCancel() {
    drawPointsRef.current = [];
    updatePolyline();
    const map = mapRef.current;
    map?.dragPan.enable();
    map?.touchZoomRotate.enable();
    setDrawMode("idle");
  }

  function startDrawing() {
    mapRef.current?.dragPan.disable();
    mapRef.current?.touchZoomRotate.disable();
    setAreaStatus(IDLE_AREA_STATUS);
    setDrawMode("drawing");
  }

  useEffect(() => {
    if (!containerRef.current || !GOONG_MAPTILES_KEY) return;
    let cancelled = false;
    // Marker.remove() during cleanup fires the popup's "close" event — skip
    // clearing selectedMarkerId in that case so it survives back navigation.
    let isCleaningUp = false;
    const extraMarkers = extraMarkersRef.current;

    const points: MapPoint[] = properties.flatMap((property) => {
      const coords = getLarkPropertyCoordinates(property);
      return coords ? [{ property, coords }] : [];
    });
    pointsRef.current = points;

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

      // Factored out so onPolygonDrawn can build markers the same way for
      // area-matched properties that fall outside the base `points` set.
      function buildMarker(property: ILarkProperty, coords: LatLng) {
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

        return new goongjs.Marker({ color: "#16a34a" })
          .setLngLat([coords.lng, coords.lat])
          .setPopup(popup)
          .addTo(map);
      }

      createMarkerRef.current = buildMarker;
      markersRef.current = points.map(({ property, coords }) => buildMarker(property, coords));

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
      extraMarkers.forEach((m) => m.remove());
      extraMarkers.clear();
      createMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [properties]);

  if (!GOONG_MAPTILES_KEY) {
    return <div className="goong-map__fallback">Thiếu cấu hình Goong Maps API key</div>;
  }

  return (
    <div className="goong-map__wrap">
      <div ref={containerRef} className="goong-map" />

      <svg
        className="goong-map__draw-overlay"
        style={{ pointerEvents: drawMode === "drawing" ? "auto" : "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <polyline
          ref={polylineRef}
          fill="none"
          stroke="#16a34a"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <button
        type="button"
        className="goong-map__lasso-btn"
        aria-label={drawMode === "active" ? "Xóa vùng đã chọn" : "Khoanh vùng"}
        disabled={drawMode === "drawing"}
        onClick={drawMode === "active" ? clearSelection : startDrawing}
      >
        {drawMode === "active" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 4h4M4 4v4M20 4h-4M20 4v4M4 20h4M4 20v-4M20 20h-4M20 20v-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {areaStatus.loading ? (
        <div className="goong-map__banner">
          <span className="goong-map__banner-spinner" />
          <span>Đang lọc khu vực…</span>
        </div>
      ) : areaStatus.error ? (
        <div className="goong-map__banner">
          <span>Không lọc được khu vực đã chọn. Vui lòng thử lại.</span>
        </div>
      ) : areaStatus.matchCount !== null ? (
        <div className="goong-map__banner">
          <span>
            {areaStatus.renderedCount !== null && areaStatus.renderedCount < areaStatus.matchCount
              ? `Vùng đã chọn: ${areaStatus.matchCount} tin — chỉ hiện ${areaStatus.renderedCount} tin trên bản đồ.`
              : `Vùng đã chọn: ${areaStatus.matchCount} tin.`}
          </span>
        </div>
      ) : null}
    </div>
  );
}
