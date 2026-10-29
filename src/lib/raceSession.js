import CheckpointSession from './models/CheckpointSession';
import { isRaceManager } from './raceAuth';

/** Load a checkpoint session by its stable sessionId or 404. */
export async function loadSession(sessionId) {
  const session = await CheckpointSession.findOne({ sessionId });
  if (!session) throw Object.assign(new Error('Checkpoint session not found'), { status: 404 });
  return session;
}

/**
 * Authorize a user for a session. The assigned official always may; a race
 * manager may too when allowManager is set. Enforces open + non-expired state
 * when requireActive is set (plan §3.1 — reject expired/revoked sessions when
 * the server is reachable).
 */
export function assertSessionAccess(user, session, { allowManager = true, requireActive = false } = {}) {
  const isOfficial = String(session.official) === String(user._id);
  if (!isOfficial && !(allowManager && isRaceManager(user))) {
    throw Object.assign(new Error('Not authorized for this checkpoint session'), { status: 403 });
  }
  if (requireActive) {
    if (session.status !== 'open') {
      throw Object.assign(new Error(`Session is ${session.status}`), { status: 403 });
    }
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
      throw Object.assign(new Error('Session has expired'), { status: 403 });
    }
  }
  return { isOfficial };
}
