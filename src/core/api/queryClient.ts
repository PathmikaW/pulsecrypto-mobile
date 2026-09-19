import { QueryClient } from '@tanstack/react-query';
import { retryDelayMs, shouldRetry } from './retry';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // /pairs/meta is cached server-side for 60s (ADR-B6); refetching sooner is wasted.
      staleTime: 60_000,
      retry: shouldRetry,
      retryDelay: retryDelayMs,
    },
  },
});
