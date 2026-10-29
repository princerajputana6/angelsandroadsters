import CheckpointSession from './models/CheckpointSession';
import { assertSessionAccess } from './raceAccess';

export { assertSessionAccess };

/** Load a checkpoint session by its stable sessionId or 404. */
export async function loadSession(sessionId) {
  const session = await CheckpointSession.findOne({ sessionId });
  if (!session) throw Object.assign(new Error('Checkpoint session not found'), { status: 404 });
  return session;
}
