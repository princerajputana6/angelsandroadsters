import { describe, it, expect } from 'vitest';
import { isRaceManager, assertSessionAccess } from '../src/lib/raceAccess';

const official = { _id: 'u-official', role: 'user' };
const other = { _id: 'u-other', role: 'user' };
const admin = { _id: 'u-admin', role: 'admin' };

const openSession = (over = {}) => ({
  official: 'u-official',
  status: 'open',
  expiresAt: new Date(Date.now() + 3600_000),
  ...over,
});

describe('race authorization (plan §3.1, §13.5)', () => {
  it('isRaceManager only for admin/eventManager', () => {
    expect(isRaceManager({ role: 'admin' })).toBe(true);
    expect(isRaceManager({ role: 'eventManager' })).toBe(true);
    expect(isRaceManager({ role: 'user' })).toBe(false);
    expect(isRaceManager(null)).toBe(false);
  });

  it('allows the assigned official', () => {
    expect(assertSessionAccess(official, openSession(), { requireActive: true }).isOfficial).toBe(true);
  });

  it('denies an unrelated user (IDOR / other event)', () => {
    expect(() => assertSessionAccess(other, openSession(), { allowManager: false })).toThrowError(/Not authorized/);
  });

  it('allows a manager only when allowManager is set', () => {
    expect(() => assertSessionAccess(admin, openSession(), { allowManager: false })).toThrow();
    expect(assertSessionAccess(admin, openSession(), { allowManager: true }).isOfficial).toBe(false);
  });

  it('rejects an expired session when active is required', () => {
    const expired = openSession({ expiresAt: new Date(Date.now() - 1000) });
    expect(() => assertSessionAccess(official, expired, { requireActive: true })).toThrowError(/expired/);
  });

  it('rejects a revoked session when active is required (plan §9.2)', () => {
    const revoked = openSession({ status: 'revoked' });
    expect(() => assertSessionAccess(official, revoked, { requireActive: true })).toThrowError(/revoked/);
  });
});
