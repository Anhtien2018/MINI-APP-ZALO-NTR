import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Reference data (web config, categories, cities...) barely changes within a
// session — cache it much longer than the default so every page reusing it
// after the splash bootstrap never refetches.
export const STATIC_QUERY_OPTIONS = {
  staleTime: 10 * 60 * 1000,
  gcTime: 60 * 60 * 1000,
} as const;
