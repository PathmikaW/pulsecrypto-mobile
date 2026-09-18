import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // /pairs/meta is cached server-side for 60s (ADR-B6) — refetching more eagerly than
      // that on the client just re-requests the same cached response.
      staleTime: 60_000,
    },
  },
});
