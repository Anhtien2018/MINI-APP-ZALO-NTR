import { create } from "zustand";
import type {
  IWebConfiguration,
  IHomeConfiguration,
  ILarkStatusOption,
  ILarkDistrict,
  ILarkPhuong,
  ILarkProperty,
  IFavorite,
} from "@/types";

interface AppState {
  webConfig: IWebConfiguration | null;
  homeConfig: IHomeConfiguration | null;
  businessTypes: ILarkStatusOption[];
  propertyCategories: ILarkStatusOption[];
  cities: ILarkStatusOption[];
  districts: ILarkDistrict[];
  wards: ILarkPhuong[];
  priceRanges: ILarkStatusOption[];
  mainDirections: ILarkStatusOption[];
  otherApartmentAmenities: ILarkStatusOption[];
  externalAmenities: ILarkStatusOption[];
  bedroomAmenities: ILarkStatusOption[];
  isHydrated: boolean;
  setWebConfig: (config: IWebConfiguration) => void;
  setHomeConfig: (config: IHomeConfiguration) => void;
  setBusinessTypes: (types: ILarkStatusOption[]) => void;
  setPropertyCategories: (cats: ILarkStatusOption[]) => void;
  setCities: (cities: ILarkStatusOption[]) => void;
  setDistricts: (districts: ILarkDistrict[]) => void;
  setWards: (wards: ILarkPhuong[]) => void;
  setPriceRanges: (ranges: ILarkStatusOption[]) => void;
  setMainDirections: (dirs: ILarkStatusOption[]) => void;
  setOtherApartmentAmenities: (items: ILarkStatusOption[]) => void;
  setExternalAmenities: (items: ILarkStatusOption[]) => void;
  setBedroomAmenities: (items: ILarkStatusOption[]) => void;
  setHydrated: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  webConfig: null,
  homeConfig: null,
  businessTypes: [],
  propertyCategories: [],
  cities: [],
  districts: [],
  wards: [],
  priceRanges: [],
  mainDirections: [],
  otherApartmentAmenities: [],
  externalAmenities: [],
  bedroomAmenities: [],
  isHydrated: false,
  setWebConfig: (config) => set({ webConfig: config }),
  setHomeConfig: (config) => set({ homeConfig: config }),
  setBusinessTypes: (types) => set({ businessTypes: types }),
  setPropertyCategories: (cats) => set({ propertyCategories: cats }),
  setCities: (cities) => set({ cities }),
  setDistricts: (districts) => set({ districts }),
  setWards: (wards) => set({ wards }),
  setPriceRanges: (ranges) => set({ priceRanges: ranges }),
  setMainDirections: (dirs) => set({ mainDirections: dirs }),
  setOtherApartmentAmenities: (items) => set({ otherApartmentAmenities: items }),
  setExternalAmenities: (items) => set({ externalAmenities: items }),
  setBedroomAmenities: (items) => set({ bedroomAmenities: items }),
  setHydrated: (v) => set({ isHydrated: v }),
}));

interface HomeState {
  sectionProperties: [ILarkProperty[], ILarkProperty[], ILarkProperty[]];
  sectionLoaded: [boolean, boolean, boolean];
  setSectionProperties: (i: 0 | 1 | 2, items: ILarkProperty[]) => void;
}

export const useHomeStore = create<HomeState>((set) => ({
  sectionProperties: [[], [], []],
  sectionLoaded: [false, false, false],
  setSectionProperties: (i, items) =>
    set((s) => {
      const next = [...s.sectionProperties] as [ILarkProperty[], ILarkProperty[], ILarkProperty[]];
      next[i] = items;
      const nextLoaded = [...s.sectionLoaded] as [boolean, boolean, boolean];
      nextLoaded[i] = true;
      return { sectionProperties: next, sectionLoaded: nextLoaded };
    }),
}));

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
