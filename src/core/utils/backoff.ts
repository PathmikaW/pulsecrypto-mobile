export interface BackoffOptions {
  baseMs: number;
  capMs: number;
  /** ±fraction of the delay, e.g. 0.2 = ±20%. */
  jitterRatio: number;
}

/** Exponential backoff with jitter: base * 2^attempt, capped, then jittered. `attempt` is 0-based. */
export function computeBackoffMs(
  attempt: number,
  { baseMs, capMs, jitterRatio }: BackoffOptions,
  random: () => number = Math.random
): number {
  const raw = Math.min(baseMs * 2 ** attempt, capMs);
  const jitter = raw * jitterRatio * (random() * 2 - 1);
  return Math.max(0, Math.round(raw + jitter));
}
