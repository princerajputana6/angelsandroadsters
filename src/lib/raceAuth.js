import { requireUser } from './auth';
import { connectDB } from './db';
import RaceAuditLog from './models/RaceAuditLog';

/**
 * Race authorization helpers. These build on the app's existing identity/role
 * system (auth.js, User.role) rather than inventing a second auth system
 * (plan §3, §3.1). Permissions MUST be enforced in every server route — never
 * trust the client (plan §2.7).
 *
 * Current role mapping (first release):
 *   - admin         -> full race configuration + results + corrections
 *   - eventManager  -> manage races/entries/config for events (race manager)
 *
 * Checkpoint officials authenticate as users and are additionally authorized
 * per checkpoint session (added with the offline race-control slice, M3).
 */

const RACE_MANAGER_ROLES = ['admin', 'eventManager'];

export function isRaceManager(user) {
  return !!user && RACE_MANAGER_ROLES.includes(user.role);
}

/** Require a signed-in user allowed to manage race configuration. */
export async function requireRaceManager() {
  const user = await requireUser();
  if (!isRaceManager(user)) {
    throw Object.assign(new Error('Race management access required'), { status: 403 });
  }
  return user;
}

/**
 * Append an audit record for a privileged action (plan §4.4, §11). Best-effort:
 * a logging failure must never mask or roll back the primary action, but it is
 * logged to the server console so it is not silently lost.
 */
export async function logRaceAudit({ actor, action, event, race, targetType, targetId, reason, meta }) {
  try {
    await connectDB();
    await RaceAuditLog.create({
      actor: actor?._id || actor?.id || actor,
      actorEmail: actor?.email || '',
      action,
      event: event || undefined,
      race: race || undefined,
      targetType: targetType || '',
      targetId: targetId ? String(targetId) : '',
      reason: reason || '',
      meta: meta || {},
    });
  } catch (err) {
    console.error('[raceAudit] failed to write audit log:', err.message);
  }
}
