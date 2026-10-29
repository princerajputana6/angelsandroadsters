import { describe, it, expect } from 'vitest';
import { parseOrThrow, raceCreateSchema, entryCreateSchema } from '../src/lib/raceValidation';

const oid = '507f1f77bcf86cd799439011';

describe('API input validation (plan §8.3, §11)', () => {
  it('accepts a valid race create payload', () => {
    const data = parseOrThrow(raceCreateSchema, { event: oid, name: 'Pro Enduro', expectedLaps: 3 });
    expect(data.name).toBe('Pro Enduro');
  });

  it('rejects a race without a name and reports status 400', () => {
    try {
      parseOrThrow(raceCreateSchema, { event: oid });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e.status).toBe(400);
      expect(e.message).toMatch(/name/);
    }
  });

  it('rejects a bad ObjectId for event', () => {
    expect(() => parseOrThrow(raceCreateSchema, { event: 'not-an-id', name: 'X' })).toThrowError(/event/);
  });

  it('accepts a valid entry and rejects a negative race number', () => {
    expect(parseOrThrow(entryCreateSchema, { race: oid, riderName: 'A', raceNumber: 12 }).raceNumber).toBe(12);
    expect(() => parseOrThrow(entryCreateSchema, { race: oid, riderName: 'A', raceNumber: -1 })).toThrow();
  });

  it('rejects an unknown consent enum value', () => {
    expect(() => parseOrThrow(entryCreateSchema, { race: oid, riderName: 'A', raceNumber: 1, consentStatus: 'bogus' })).toThrow();
  });
});
