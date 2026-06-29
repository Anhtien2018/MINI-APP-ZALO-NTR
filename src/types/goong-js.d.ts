declare module "@goongmaps/goong-js" {
  export interface GoongLngLat {
    lng: number;
    lat: number;
  }

  export interface GoongPopup {
    setLngLat(lngLat: [number, number]): GoongPopup;
    setHTML(html: string): GoongPopup;
    setDOMContent(node: Node): GoongPopup;
    addTo(map: GoongMap): GoongPopup;
    remove(): GoongPopup;
    on(type: "open" | "close", listener: () => void): GoongPopup;
    off(type: "open" | "close", listener: () => void): GoongPopup;
  }

  export interface GoongMarker {
    setLngLat(lngLat: [number, number]): GoongMarker;
    getLngLat(): GoongLngLat;
    addTo(map: GoongMap): GoongMarker;
    setPopup(popup: GoongPopup): GoongMarker;
    togglePopup(): GoongMarker;
    remove(): GoongMarker;
    on(type: "dragend", listener: () => void): GoongMarker;
  }

  export interface GoongLngLatBounds {
    extend(lngLat: [number, number]): GoongLngLatBounds;
  }

  export interface GoongMap {
    remove(): void;
    resize(): void;
    getCenter(): { lng: number; lat: number };
    getZoom(): number;
    setCenter(center: [number, number]): GoongMap;
    fitBounds(
      bounds: GoongLngLatBounds,
      options?: { padding?: number },
    ): GoongMap;
    on(type: "error", listener: (e: { error?: Error }) => void): GoongMap;
    on(type: "moveend", listener: () => void): GoongMap;
    once(type: "idle" | "load", listener: () => void): GoongMap;
  }

  export interface GoongMapOptions {
    container: HTMLElement;
    style?: string;
    center?: [number, number];
    zoom?: number;
  }

  export interface GoongMarkerOptions {
    draggable?: boolean;
    color?: string;
  }

  export interface GoongPopupOptions {
    offset?: number;
    maxWidth?: string;
    closeButton?: boolean;
    className?: string;
  }

  interface GoongJsStatic {
    accessToken: string;
    Map: new (options: GoongMapOptions) => GoongMap;
    Marker: new (options?: GoongMarkerOptions) => GoongMarker;
    Popup: new (options?: GoongPopupOptions) => GoongPopup;
    LngLatBounds: new () => GoongLngLatBounds;
  }

  const goongjs: GoongJsStatic;
  export default goongjs;
}
