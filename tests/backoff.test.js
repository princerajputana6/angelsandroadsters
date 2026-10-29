import { describe, it, expect } from 'vitest';
import { backoff } from '../src/lib/offline/sync';

describe('sync retry backoff (bounded + jitter — plan §2.9)', () => {
  it('stays within [base/2, base] and is capped at 60s', () => {
    for (let attempts = 0; attempts <= 12; attempts++) {
      const base = Math.min(1000 * 2 ** attempts, 60_000);
      for (let i = 0; i < 50; i++) {
        const d = backoff(attempts);
        expect(d).toBeGreaterThanOrEqual(base / 2);
        expect(d).toBeLessThanOrEqual(base);
        expect(d).toBeLessThanOrEqual(60_000);
      }
    }
  });

  it('grows with attempts (median increases until the cap)', () => {
    expect(backoff(0)).toBeLessThan(60_000);
    expect(backoff(10)).toBeGreaterThan(backoff(0));
  });
});
