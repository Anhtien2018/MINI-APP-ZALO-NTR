# Map lasso area-select — mini app map page

## Problem

Mini app map page (`/map`) shows all matching properties as pins with no way
to visually select "properties in this area". Web app (sibling repo
`nguyenthinhreal-frontend`, branch `PRODUCTION`/`worktree-map-lasso-area-select`)
already ships this: a lasso icon on the map that, tapped, lets the user
freehand-draw a region with their finger; only pins inside the region stay
visible. A clear/X button restores all pins.

Port this feature to the mini app, matching web behavior 1:1, adapted to the
mini app's plain SVG/CSS UI (no MUI) and existing goong-js setup.

## Scope difference from web

Web's design had to solve grid-pagination vs map-dataset mismatch (map mode
reused the grid's paginated 50/page results). The mini app doesn't have this
problem: `MapPage` already fetches the full unpaginated result set via
`useLarkPropertiesMap` and passes `propertiesWithCoords` to
`PropertiesGoongMap`. No new fetch/cache/store wiring is needed — this port
is UI + interaction logic only.

## Approach

Direct port of web's custom pointer-capture + ray-casting implementation, no
new dependency:

- Freehand draw needs manual pointer-event capture regardless of library —
  no existing lib gives freehand drawing out of the box (`mapbox-gl-draw`
  only ships click-to-vertex modes and adds dependency-version risk against
  the goong-js fork). Mini apps have tighter bundle-size constraints than
  the web app, reinforcing against adding a drawing library.
- Point-in-polygon is a well-understood ~20-line ray-casting function, not
  worth pulling in `@turf/*` for. Freehand-drawn regions are simple
  (non self-intersecting) polygons in practice.

## Data flow

1. `PropertiesGoongMap` renders one marker per property from
   `propertiesWithCoords`, as it does today.
2. User taps the new lasso icon button (top-right overlay on the map,
   currently empty). Component enters `drawMode: "drawing"`: map's
   `dragPan`/`touchZoomRotate` disabled, a full-cover SVG overlay
   (`touch-action: none`) starts capturing `pointerdown/move/up/cancel`.
3. User drags a finger across the map; the path renders live as an SVG
   polyline for feedback.
4. On `pointerup`: sample path converted from pixel coords to lng/lat via
   `map.unproject()`, closed into a polygon. Bail out (return to `idle`, no
   filtering) if the path's bounding box is smaller than a 24px threshold —
   treats an accidental tap/jitter as a cancel, not a zero-area selection.
5. Each existing marker's stored coordinates are tested against the polygon
   with a new pure function `isPointInPolygon` in `src/lib/utils/geometry.ts`
   (standard ray-casting, planar). Markers outside get
   `marker.getElement().style.display = "none"`; markers inside are shown.
   This toggles existing marker DOM nodes directly — it does not touch the
   `properties` prop, because the map-creation effect in
   `PropertiesGoongMap` tears down and rebuilds the whole map whenever its
   `properties` dependency changes; re-running that on every lasso draw
   would flicker/reset the map.
6. The closed polygon is also rendered as a persistent GeoJSON
   source+fill-layer on the goong-js map itself (not the SVG overlay, which
   is pixel-space and would drift out of registration on pan/zoom).
   `drawMode` becomes `"active"`; the lasso icon is replaced by a clear/X
   button in the same spot.
7. Tapping clear: removes the GeoJSON layer/source, resets every marker's
   `display` to visible, returns to `drawMode: "idle"`.
8. `pointercancel` (system-gesture interruption — e.g. app switch) resets
   draw state and gives map interaction back without applying a polygon.
9. Filter/property change (`properties` array changes) resets `drawMode` to
   `"idle"` — the map-rebuild effect already re-creates markers/map on this
   dependency, so a stale lasso selection would reference removed DOM nodes.

## Components / files touched

- `src/lib/utils/geometry.ts` — new. Pure `isPointInPolygon(point, polygon)`,
  ported unchanged from web.
- `src/components/goong-map/PropertiesGoongMap.tsx` — add lasso button,
  draw-mode SVG overlay, marker visibility toggling, polygon layer
  render/clear. No prop changes.
- `src/components/goong-map/GoongMap.css` — styles for the lasso/clear
  button (matching existing `.map-search__advanced-btn` look) and the SVG
  draw overlay.
- `src/types/goong-js.d.ts` — extend with `GoongMarker.getElement()`,
  `GoongMap.unproject()`, `dragPan`/`touchZoomRotate` enable/disable,
  `addSource`/`addLayer`/`removeLayer`/`removeSource`/`getLayer`/`getSource`,
  and a `GoongGeoJSONPolygonFeature` type — mirrors web's additions.

## Edge cases

- Tap without meaningful drag → cancelled, no filter applied, button stays
  `idle` (lasso icon).
- Empty polygon (no properties inside) → all markers hidden, clear button
  still available to undo.
- Filter/property change while a lasso is active → selection resets
  (existing map-rebuild effect already remounts everything on `properties`
  change).
- No clustering added — same as web, out of scope for this change.

## Testing

- Unit test `isPointInPolygon` (point inside / outside / on boundary).
- Manual verification: draw lasso, confirm only in-region markers stay
  visible, confirm clear restores all, confirm filter change resets
  selection, confirm marker tap still opens its popup normally.
