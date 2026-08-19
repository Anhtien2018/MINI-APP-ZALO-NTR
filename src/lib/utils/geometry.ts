export interface LatLng {
  lat: number;
  lng: number;
}

// Standard ray-casting point-in-polygon test, planar (no geodesic
// correction) — accurate enough at city/district scale for a freehand-drawn
// selection area, which is always a simple (non self-intersecting) polygon.
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
