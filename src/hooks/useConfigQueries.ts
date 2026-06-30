import { useQueries, useQuery } from "@tanstack/react-query";
import {
  getWebConfiguration,
  getHomeConfiguration,
  getBusinessTypes,
  getPropertyCategories,
  getCities,
  getDistricts,
  getWards,
  getPriceRanges,
  getMainDirections,
  getOtherApartmentAmenities,
  getExternalAmenities,
  getBedroomAmenities,
} from "@/services/api";
import { STATIC_QUERY_OPTIONS } from "@/lib/queryClient";

export const configQueryKeys = {
  webConfig: ["webConfig"] as const,
  homeConfig: ["homeConfig"] as const,
  businessTypes: ["businessTypes"] as const,
  propertyCategories: ["propertyCategories"] as const,
  cities: ["cities"] as const,
  districts: ["districts"] as const,
  wards: ["wards"] as const,
  priceRanges: ["priceRanges"] as const,
  mainDirections: ["mainDirections"] as const,
  otherApartmentAmenities: ["otherApartmentAmenities"] as const,
  externalAmenities: ["externalAmenities"] as const,
  bedroomAmenities: ["bedroomAmenities"] as const,
};

export function useWebConfig() {
  return useQuery({
    queryKey: configQueryKeys.webConfig,
    queryFn: getWebConfiguration,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useHomeConfig() {
  return useQuery({
    queryKey: configQueryKeys.homeConfig,
    queryFn: getHomeConfiguration,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useBusinessTypes() {
  return useQuery({
    queryKey: configQueryKeys.businessTypes,
    queryFn: getBusinessTypes,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function usePropertyCategories() {
  return useQuery({
    queryKey: configQueryKeys.propertyCategories,
    queryFn: getPropertyCategories,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useCities() {
  return useQuery({
    queryKey: configQueryKeys.cities,
    queryFn: getCities,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useDistricts() {
  return useQuery({
    queryKey: configQueryKeys.districts,
    queryFn: getDistricts,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useWards() {
  return useQuery({
    queryKey: configQueryKeys.wards,
    queryFn: getWards,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function usePriceRanges() {
  return useQuery({
    queryKey: configQueryKeys.priceRanges,
    queryFn: getPriceRanges,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useMainDirections() {
  return useQuery({
    queryKey: configQueryKeys.mainDirections,
    queryFn: getMainDirections,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useOtherApartmentAmenities() {
  return useQuery({
    queryKey: configQueryKeys.otherApartmentAmenities,
    queryFn: getOtherApartmentAmenities,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useExternalAmenities() {
  return useQuery({
    queryKey: configQueryKeys.externalAmenities,
    queryFn: getExternalAmenities,
    ...STATIC_QUERY_OPTIONS,
  });
}

export function useBedroomAmenities() {
  return useQuery({
    queryKey: configQueryKeys.bedroomAmenities,
    queryFn: getBedroomAmenities,
    ...STATIC_QUERY_OPTIONS,
  });
}

// Pre-warms every config query in parallel (mirrors the old splash-screen
// Promise.all) so the rest of the app can rely on them already being cached.
// `combine` collapses the 12 results down to the single flag app.tsx needs.
export function useConfigBootstrap() {
  return useQueries({
    queries: [
      { queryKey: configQueryKeys.webConfig, queryFn: getWebConfiguration, ...STATIC_QUERY_OPTIONS },
      { queryKey: configQueryKeys.homeConfig, queryFn: getHomeConfiguration, ...STATIC_QUERY_OPTIONS },
      {
        queryKey: configQueryKeys.businessTypes,
        queryFn: getBusinessTypes,
        ...STATIC_QUERY_OPTIONS,
      },
      {
        queryKey: configQueryKeys.propertyCategories,
        queryFn: getPropertyCategories,
        ...STATIC_QUERY_OPTIONS,
      },
      { queryKey: configQueryKeys.cities, queryFn: getCities, ...STATIC_QUERY_OPTIONS },
      { queryKey: configQueryKeys.districts, queryFn: getDistricts, ...STATIC_QUERY_OPTIONS },
      { queryKey: configQueryKeys.wards, queryFn: getWards, ...STATIC_QUERY_OPTIONS },
      { queryKey: configQueryKeys.priceRanges, queryFn: getPriceRanges, ...STATIC_QUERY_OPTIONS },
      {
        queryKey: configQueryKeys.mainDirections,
        queryFn: getMainDirections,
        ...STATIC_QUERY_OPTIONS,
      },
      {
        queryKey: configQueryKeys.otherApartmentAmenities,
        queryFn: getOtherApartmentAmenities,
        ...STATIC_QUERY_OPTIONS,
      },
      {
        queryKey: configQueryKeys.externalAmenities,
        queryFn: getExternalAmenities,
        ...STATIC_QUERY_OPTIONS,
      },
      {
        queryKey: configQueryKeys.bedroomAmenities,
        queryFn: getBedroomAmenities,
        ...STATIC_QUERY_OPTIONS,
      },
    ],
    combine: (results) => ({
      isPending: results.some((r) => r.isPending),
    }),
  });
}
