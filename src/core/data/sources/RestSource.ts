import { httpGet } from '../../api/httpClient';
import { SupportedPairsMetaSchema, type SupportedPairsMeta } from '../../../contracts/schemas';

export async function fetchPairsMeta(): Promise<SupportedPairsMeta> {
  const raw = await httpGet<unknown>('/pairs/meta');
  return SupportedPairsMetaSchema.parse(raw);
}
