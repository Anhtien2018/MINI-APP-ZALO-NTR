import { create } from "zustand";
import type { IFavorite } from "@/types";

export interface ListingsFilter {
  transactionType: string;
  propertyType: string;
  city: string;
  district: string;
  priceRange: string;
  search: string;
  features: string[];
}

interface ListingsState {
  filter: ListingsFilter;
  setFilter: (f: Partial<ListingsFilter>) => void;
  setSearch: (value: string) => void;
  resetFilter: () => void;
  // Whether the quick-filter dropdown row (under QuickFilterBar) is expanded.
  // Lives here (not component-local state) so QuickFilterBar can be dropped
  // into any page without prop-drilling the open/closed state.
  filtersOpen: boolean;
  toggleFiltersOpen: () => void;
}

export const EMPTY_FILTER: ListingsFilter = {
  transactionType: "",
  propertyType: "",
  city: "",
  district: "",
  priceRange: "",
  search: "",
  features: [],
};

// Mirrors web's useListings.ts setSearch: debounce live text-search by 400ms
// before applying it to the shared filter, instead of firing on every keystroke.
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useListingsStore = create<ListingsState>((set) => ({
  filter: { ...EMPTY_FILTER },
  setFilter: (f) => set((s) => ({ filter: { ...s.filter, ...f } })),
  setSearch: (value) => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      set((s) => ({ filter: { ...s.filter, search: value } }));
    }, 400);
  },
  resetFilter: () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    set({ filter: { ...EMPTY_FILTER } });
  },
  filtersOpen: false,
  toggleFiltersOpen: () => set((s) => ({ filtersOpen: !s.filtersOpen })),
}));

interface MapState {
  // UI state that should survive navigating away from the map page and back
  // (e.g. clicking a marker's popup, then hitting back). The actual property
  // list now lives in react-query (see useLarkPropertiesMap).
  selectedMarkerId: string | null;
  setSelectedMarkerId: (id: string | null) => void;
  mapCenter: [number, number] | null;
  mapZoom: number | null;
  setMapView: (center: [number, number], zoom: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedMarkerId: null,
  setSelectedMarkerId: (id) => set({ selectedMarkerId: id }),
  mapCenter: null,
  mapZoom: null,
  setMapView: (mapCenter, mapZoom) => set({ mapCenter, mapZoom }),
}));

interface FavoritesState {
  favorites: IFavorite[];
  addFavorite: (propertyId: string) => void;
  removeFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  addFavorite: (propertyId) =>
    set((s) => ({
      favorites: [...s.favorites, { propertyId, savedAt: new Date().toISOString() }],
    })),
  removeFavorite: (propertyId) =>
    set((s) => ({ favorites: s.favorites.filter((f) => f.propertyId !== propertyId) })),
  isFavorite: (propertyId) => get().favorites.some((f) => f.propertyId === propertyId),
}));

// Vị trí đang xem trong video feed trang chủ — giữ qua chuyển page (mirror
// useHomeStore bên web giữ cache section trang chủ): quay lại Trang chủ là
// đứng đúng video cũ thay vì reset về đầu và "load lại" cả feed. Dữ liệu
// danh sách video do react-query giữ (useVideos, cache cả phiên); store này
// chỉ cần nhớ vị trí.
interface VideoFeedState {
  activeIndex: number;
  setActiveIndex: (i: number) => void;
}

export const useVideoFeedStore = create<VideoFeedState>((set) => ({
  activeIndex: 0,
  setActiveIndex: (activeIndex) => set({ activeIndex }),
}));

// Vị trí item đang xem dở của feed 360 — nhớ ngoài React render để khi rời
// sang tab khác rồi quay lại là đứng đúng chỗ (mirror useVideoFeedStore).
export const useView360Store = create<VideoFeedState>((set) => ({
  activeIndex: 0,
  setActiveIndex: (activeIndex) => set({ activeIndex }),
}));
