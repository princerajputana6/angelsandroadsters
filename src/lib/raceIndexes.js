/**
 * Centralized race-model registration + index creation/verification.
 *
 * Why this lives in the Next runtime (not a plain node script): the models are
 * authored as ESM and compiled by Next; a bare `node` CLI cannot import them in
 * this repo. Running index creation here means we verify indexes in the ACTUAL
 * deployed environment (plan §8.3) and can trigger it from the admin UI or CI.
 *
 * Uses `createIndexes()` (never `syncIndexes()`) so we only ADD missing indexes
 * and never drop anything — safe to run repeatedly against production data.
 * Unique-index build failures caused by pre-existing duplicate data are
 * reported, not swallowed, so an operator can clean up before enabling race ops.
 */
import { connectDB } from './db';

// Importing the models registers them on the shared mongoose instance (also
// required for populate() to work across routes).
import Race from './models/Race';
import RaceCategory from './models/RaceCategory';
import RaceEntry from './models/RaceEntry';
import RaceDevice from './models/RaceDevice';
import CheckpointSession from './models/CheckpointSession';
import RaceConfiguration from './models/RaceConfiguration';
import RaceEvent from './models/RaceEvent';
import RaceConflict from './models/RaceConflict';
import RaceAuditLog from './models/RaceAuditLog';
import RaceResult from './models/RaceResult';
import SyncReceipt from './models/SyncReceipt';

export const RACE_MODELS = {
  Race,
  RaceCategory,
  RaceEntry,
  RaceDevice,
  CheckpointSession,
  RaceConfiguration,
  RaceEvent,
  RaceConflict,
  RaceAuditLog,
  RaceResult,
  SyncReceipt,
};

/**
 * Create any missing indexes for every race model. Returns a per-model report.
 * Never throws for a single model's failure — collects the error instead so the
 * caller sees the full picture (e.g. which unique index could not build).
 */
export async function ensureRaceIndexes() {
  await connectDB();
  const report = [];
  for (const [name, Model] of Object.entries(RACE_MODELS)) {
    try {
      await Model.createIndexes();
      report.push({ model: name, ok: true });
    } catch (err) {
      report.push({
        model: name,
        ok: false,
        // code 11000 => duplicate key: a unique index cannot build because
        // legacy/duplicate data exists. Surface it; do not auto-delete data.
        code: err.code,
        error: err.message,
      });
    }
  }
  const ok = report.every((r) => r.ok);
  return { ok, report };
}

/**
 * Read-only: list the indexes currently present for each race collection so an
 * operator can confirm the unique constraints really exist before go-live.
 */
export async function getRaceIndexReport() {
  await connectDB();
  const report = [];
  for (const [name, Model] of Object.entries(RACE_MODELS)) {
    try {
      const indexes = await Model.collection.indexes();
      report.push({
        model: name,
        indexes: indexes.map((i) => ({
          name: i.name,
          key: i.key,
          unique: !!i.unique,
          partial: !!i.partialFilterExpression,
        })),
      });
    } catch (err) {
      // Collection may not exist yet (nothing inserted) — that's fine.
      report.push({ model: name, indexes: [], note: err.message });
    }
  }
  return report;
}
