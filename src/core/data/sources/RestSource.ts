import { apiClient } from '../../api/apiClient';
import { toAppError } from '../../api/errors';
import { SupportedPairsMetaSchema, type SupportedPairsMeta } from '../../../contracts/schemas';

export async function fetchPairsMeta(signal?: AbortSignal): Promise<SupportedPairsMeta> {
  const { data } = await apiClient.get<unknown>('/pairs/meta', { signal });
  const parsed = SupportedPairsMetaSchema.safeParse(data);
  if (!parsed.success) throw toAppError(parsed.error);
  return parsed.data;
}
