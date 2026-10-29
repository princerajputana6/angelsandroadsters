/**
 * Pure race authorization predicates (no server imports) so the security logic
 * is directly unit-testable (plan §13.5) without pulling next/headers or the DB.
 * The request-bound wrappers (requireRaceManager, route guards) live in
 * raceAuth.js / raceSession.js and build on these.
 */
export const RACE_MANAGER_ROLES = ['admin', 'eventManager'];

export function isRaceManager(user) {
  return !!user && RACE_MANAGER_ROLES.includes(user.role);
}

/**
 * Authorize a user for a checkpoint session. The assigned official always may;
 * a race manager may too when allowManager is set. With requireActive, an
 * expired or non-open (closed/revoked) session is rejected even for the
 * official (plan §3.1 — reject expired/revoked sessions when reachable).
 * Throws an Error with a numeric `status` on denial; returns { isOfficial }.
 */
export function assertSessionAccess(user, session, { allowManager = true, requireActive = false, now = Date.now() } = {}) {
  const isOfficial = String(session.official) === String(user._id);
  if (!isOfficial && !(allowManager && isRaceManager(user))) {
    throw Object.assign(new Error('Not authorized for this checkpoint session'), { status: 403 });
  }
  if (requireActive) {
    if (session.status !== 'open') {
      throw Object.assign(new Error(`Session is ${session.status}`), { status: 403 });
    }
    if (session.expiresAt && new Date(session.expiresAt).getTime() < now) {
      throw Object.assign(new Error('Session has expired'), { status: 403 });
    }
  }
  return { isOfficial };
}
