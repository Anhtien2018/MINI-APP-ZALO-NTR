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

## Scope correction

An earlier version of this spec was written against a stale reference: an
old design doc from a diverged web branch where lasso was pure client-side
point-in-polygon filtering of whatever was already loaded. Current
`PRODUCTION` web behavior is different and more correct — the mini app's
initial map fetch (`useLarkPropertiesMap`, capped at `limit: 100`, same cap
as web's `MAP_FETCH_LIMIT`) can't be trusted to contain everything inside an
arbitrary drawn region, so **drawing a lasso re-queries the backend** with
the active filters and `limit: -1`, and runs the point-in-polygon test
against that full set — not just the already-rendered markers. This spec is
corrected to match that.

Directus has no bbox/geo query support for the map's plain `"lng,lat"`
string field (not a real geo column), so the polygon test still can't be
pushed down as a query filter — it runs in-memory over the uncapped fetch
result, same as web's `fetchAreaListings`. Unlike web (a Next.js app with
server actions), the mini app already calls Directus directly from the
browser via `services/api.ts` — so this re-fetch is just another
`getLarkPropertiesPaginated` call from the client, no new server action
layer needed.

## Approach

Direct port of web's custom pointer-capture + ray-casting + area re-fetch
implementation, no new dependency:

- Freehand draw needs manual pointer-event capture regardless of library —
  no existing lib gives freehand drawing out of the box (`mapbox-gl-draw`
  only ships click-to-vertex modes and adds dependency-version risk against
  the goong-js fork). Mini apps have tighter bundle-size constraints than
  the web app, reinforcing against adding a drawing library.
- Point-in-polygon is a well-understood ~20-line ray-casting function, not
  worth pulling in `@turf/*` for. Freehand-drawn regions are simple
  (non self-intersecting) polygons in practice.
- Reuses the existing `getLarkPropertiesPaginated` client call with
  `limit: -1` for the area re-fetch — no new endpoint or service function.

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
5. The polygon is rendered immediately as a persistent GeoJSON
   source+fill-layer on the goong-js map itself (not the SVG overlay, which
   is pixel-space and would drift out of registration on pan/zoom).
   `drawMode` becomes `"active"`, the lasso icon is replaced by a clear/X
   button, and a "Đang lọc khu vực…" loading banner appears.
6. `getLarkPropertiesPaginated({ ...filter, page: 1, limit: -1 })` re-fetches
   every property matching the active filters, uncapped. Each result's
   coordinates are tested against the polygon with a new pure function
   `isPointInPolygon` in `src/lib/utils/geometry.ts` (standard ray-casting,
   planar). A request-id counter discards a response that resolves after a
   newer polygon has already been drawn (fast redraw / redraw-after-error).
7. Matched properties that already have a marker (part of the initial capped
   batch) get `marker.getElement().style.display` toggled — visible if
   matched, hidden otherwise. This toggles existing marker DOM nodes
   directly rather than touching the `properties` prop, because the
   map-creation effect in `PropertiesGoongMap` tears down and rebuilds the
   whole map whenever `properties` changes; re-running that on every lasso
   draw would flicker/reset the map.
8. Matched properties with no existing marker (matched-but-never-fetched by
   the initial capped load) get one built via the same `buildMarker` closure
   the initial batch uses (factored out, stored in a ref so the drawn-outside
   handler can reach it), capped at `AREA_RENDER_LIMIT` (100) markers total
   to bound DOM/marker creation — `matchCount` in the status banner stays
   the true, uncapped count even when `renderedCount` is capped lower.
9. On success: banner switches to `"Vùng đã chọn: N tin"` (plus a truncation
   note if `renderedCount < matchCount`). On fetch failure: polygon layer
   and marker visibility are rolled back, `drawMode` returns to `"idle"`,
   banner shows an error message.
10. Tapping clear: removes the GeoJSON layer/source, removes extra markers,
    resets every base marker's `display` to visible, returns to
    `drawMode: "idle"`, clears the banner.
11. `pointercancel` (system-gesture interruption — e.g. app switch) resets
    draw state and gives map interaction back without applying a polygon.
12. Filter/property change (`properties` array changes) resets `drawMode`
    and the status banner to idle — the map-rebuild effect already
    re-creates markers/map on this dependency, so a stale lasso selection
    would reference removed DOM nodes.

## Components / files touched

- `src/lib/utils/geometry.ts` — new. Pure `isPointInPolygon(point, polygon)`,
  ported unchanged from web.
- `src/components/goong-map/PropertiesGoongMap.tsx` — add lasso button,
  draw-mode SVG overlay, area re-fetch on draw (`onPolygonDrawn`), marker
  visibility toggling + extra-marker creation for area matches, polygon
  layer render/clear, status banner. New `filter: IListingsFilter` prop
  (marker-building logic factored into a `buildMarker` closure, stored in
  `createMarkerRef`, so both the initial batch and area-matched extras use
  it identically).
- `src/pages/map/MapPage.tsx` — the filter object already built for
  `useLarkPropertiesMap` is hoisted to a local (`mapFilter`) and passed to
  `PropertiesGoongMap` as the new `filter` prop, unchanged otherwise.
- `src/components/goong-map/GoongMap.css` — styles for the lasso/clear
  button (matching existing `.map-search__advanced-btn` look), the SVG draw
  overlay, and the top-center status banner (loading spinner / error /
  match-count messages).
- `src/types/goong-js.d.ts` — extend with `GoongMarker.getElement()`,
  `GoongMap.unproject()`, `dragPan`/`touchZoomRotate` enable/disable,
  `addSource`/`addLayer`/`removeLayer`/`removeSource`/`getLayer`/`getSource`,
  and a `GoongGeoJSONPolygonFeature` type — mirrors web's additions.

## Edge cases

- Tap without meaningful drag → cancelled, no filter applied, button stays
  `idle` (lasso icon).
- Empty polygon (no properties matched) → all markers hidden, clear button
  still available to undo, banner reads "Vùng đã chọn: 0 tin".
- Area fetch fails (network/Directus error) → selection rolled back to
  idle, banner shows an error message instead of leaving a stuck loading
  state or a polygon with no visible effect.
- A second lasso drawn before the first's fetch resolves → request-id guard
  discards the stale response instead of letting it clobber the newer draw.
- Match count exceeds `AREA_RENDER_LIMIT` (100) → banner reports the true
  match count alongside how many are actually rendered.
- Filter/property change while a lasso is active → selection and banner
  reset (existing map-rebuild effect already remounts everything on
  `properties` change).
- No clustering added — same as web, out of scope for this change.

## Testing

- Unit test `isPointInPolygon` (point inside / outside / on boundary) —
  no test runner is currently configured in this repo, so this is deferred;
  verified manually instead (see below).
- Manual verification: draw lasso, confirm loading banner appears then
  resolves to a match-count banner, confirm only in-region markers stay
  visible (including ones outside the initial 100-item batch, if
  reachable), confirm clear restores all and clears the banner, confirm
  filter change resets selection, confirm marker tap still opens its popup
  normally, confirm a simulated fetch failure rolls back cleanly.
