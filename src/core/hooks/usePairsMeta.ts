import { useQuery } from '@tanstack/react-query';
import { fetchPairsMeta } from '../data/sources/RestSource';

// Pull-to-refresh refetches this query only and never touches the WS connection (ADR-M2).
export function usePairsMeta() {
  return useQuery({
    queryKey: ['pairsMeta'],
    queryFn: ({ signal }) => fetchPairsMeta(signal),
  });
}
