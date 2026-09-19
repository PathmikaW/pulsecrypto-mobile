import { computeBackoffMs } from '../../src/core/utils/backoff';

const options = { baseMs: 1000, capMs: 30000, jitterRatio: 0.2 };

describe('computeBackoffMs', () => {
  it('doubles per attempt and caps at capMs (no jitter when random is 0.5)', () => {
    const noJitter = () => 0.5;
    expect([0, 1, 2, 3, 4].map((a) => computeBackoffMs(a, options, noJitter))).toEqual([
      1000, 2000, 4000, 8000, 16000,
    ]);
    expect(computeBackoffMs(5, options, noJitter)).toBe(30000);
    expect(computeBackoffMs(20, options, noJitter)).toBe(30000);
  });

  it('applies ±jitterRatio around the raw delay', () => {
    expect(computeBackoffMs(2, options, () => 0)).toBe(3200);
    expect(computeBackoffMs(2, options, () => 1)).toBe(4800);
  });

  it('never returns a negative delay', () => {
    expect(computeBackoffMs(0, { baseMs: 10, capMs: 10, jitterRatio: 5 }, () => 0)).toBe(0);
  });
});
