import React, { useEffect, useRef } from "react";
import type { GoongMap as GoongMapInstance, GoongMarker } from "@goongmaps/goong-js";
import { GOONG_MAPTILES_KEY } from "@/constants";
import { GOONG_MAP_STYLE } from "@/constants/goong";
import { loadGoongJs } from "@/utils/loadGoongJs";
import "./GoongMap.css";

interface Props {
  lat: number;
  lng: number;
}

export function GoongMap({ lat, lng }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoongMapInstance | null>(null);
  const markerRef = useRef<GoongMarker | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current || !GOONG_MAPTILES_KEY) return;
    let cancelled = false;

    loadGoongJs().then((goongjs) => {
      if (cancelled || !containerRef.current) return;

      goongjs.accessToken = GOONG_MAPTILES_KEY;
      const map = new goongjs.Map({
        container: containerRef.current,
        style: GOONG_MAP_STYLE,
        center: [lng, lat],
        zoom: 16,
      });
      map.on("error", () => {});

      const marker = new goongjs.Marker({ color: "#16a34a" }).setLngLat([lng, lat]).addTo(map);

      mapRef.current = map;
      markerRef.current = marker;

      const resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current as HTMLDivElement);
      resizeObserverRef.current = resizeObserver;
    });

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      markerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setCenter([lng, lat]);
    markerRef.current?.setLngLat([lng, lat]);
  }, [lat, lng]);

  if (!GOONG_MAPTILES_KEY) {
    return <div className="goong-map__fallback">Thiếu cấu hình Goong Maps API key</div>;
  }

  return <div ref={containerRef} className="goong-map" />;
}
