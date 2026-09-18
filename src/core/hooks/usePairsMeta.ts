import { useQuery } from '@tanstack/react-query';
import { fetchPairsMeta } from '../data/sources/RestSource';

// Pull-to-refresh calls this query's refetch() only — it must never touch useWebSocket's
// connection (ADR-M2/offline-behavior.md: client state and server state are structurally
// independent, not just independent by convention).
export function usePairsMeta() {
  return useQuery({
    queryKey: ['pairsMeta'],
    queryFn: fetchPairsMeta,
  });
}
