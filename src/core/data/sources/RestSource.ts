import { httpGet } from '../../api/httpClient';
import { toAppError } from '../../api/errors';
import { SupportedPairsMetaSchema, type SupportedPairsMeta } from '../../../contracts/schemas';

export async function fetchPairsMeta(signal?: AbortSignal): Promise<SupportedPairsMeta> {
  const raw = await httpGet<unknown>('/pairs/meta', signal);
  const parsed = SupportedPairsMetaSchema.safeParse(raw);
  if (!parsed.success) throw toAppError(parsed.error);
  return parsed.data;
}
