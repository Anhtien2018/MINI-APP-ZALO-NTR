import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import {
  getLarkPropertiesByType,
  getLarkPropertiesPaginated,
  getLarkPropertyByRecordId,
  getRelatedProperties,
  type IListingsFilter,
} from "@/services/api";
import { PAGE_LIMIT } from "@/constants";
import type { ILarkProperty } from "@/types";

interface PropertiesPage {
  data: ILarkProperty[];
  total: number;
}

function getNextPageParam(lastPage: PropertiesPage, allPages: PropertiesPage[]) {
  const loaded = allPages.reduce((sum, p) => sum + p.data.length, 0);
  return loaded < lastPage.total ? allPages.length + 1 : undefined;
}

export function useLarkPropertiesByType(
  listingTypeId: string | undefined,
  statusId: string | null | undefined,
  limit = 6,
) {
  return useQuery({
    queryKey: ["properties", "by-type", listingTypeId, statusId, limit],
    queryFn: () => getLarkPropertiesByType(listingTypeId!, statusId ?? null, limit),
    enabled: !!listingTypeId,
  });
}

export function useLarkPropertiesSearch(filter: IListingsFilter) {
  return useInfiniteQuery({
    queryKey: ["properties", "search", filter],
    queryFn: ({ pageParam }) =>
      getLarkPropertiesPaginated({ ...filter, page: pageParam, limit: PAGE_LIMIT }),
    initialPageParam: 1,
    getNextPageParam,
  });
}

export function useLarkPropertiesMap(filter: IListingsFilter) {
  return useQuery({
    queryKey: ["properties", "map", filter],
    queryFn: () => getLarkPropertiesPaginated({ ...filter, page: 1, limit: 100 }),
  });
}

export function useLarkPropertiesView360(statusId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["properties", "view360", statusId],
    queryFn: ({ pageParam }) =>
      getLarkPropertiesPaginated({ status: statusId, hasLink3d: true, page: pageParam, limit: PAGE_LIMIT }),
    initialPageParam: 1,
    getNextPageParam,
  });
}

export function usePropertyDetail(recordId: string) {
  return useQuery({
    queryKey: ["property", recordId],
    queryFn: () => getLarkPropertyByRecordId(recordId),
    enabled: !!recordId,
  });
}

// Same `["property", id]` key as usePropertyDetail — a favorite already
// opened in DetailPage is served straight from cache here, and vice versa.
export function useFavoriteProperties(propertyIds: string[]) {
  return useQueries({
    queries: propertyIds.map((id) => ({
      queryKey: ["property", id],
      queryFn: () => getLarkPropertyByRecordId(id),
    })),
    combine: (results) => ({
      properties: results.map((r) => r.data).filter((p): p is ILarkProperty => !!p),
      isLoading: results.some((r) => r.isLoading),
    }),
  });
}

export function useRelatedProperties(
  propertyId: string | undefined,
  categoryId: string | undefined,
  statusId: string | undefined,
) {
  return useInfiniteQuery({
    queryKey: ["properties", "related", propertyId, categoryId, statusId],
    queryFn: ({ pageParam }) =>
      getRelatedProperties(propertyId!, categoryId!, statusId, PAGE_LIMIT, pageParam),
    initialPageParam: 1,
    getNextPageParam,
    enabled: !!propertyId && !!categoryId,
  });
}
