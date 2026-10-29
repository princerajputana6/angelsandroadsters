# Race Management — Support & Operations Runbook

Operational procedures for the offline-first Race Management module. This
complements `plan.md` (the implementation contract). It covers day-of-event
support, incident handling, backup/recovery, and the manual field tests that
the automated unit suite cannot cover.

> **Reliability note (from plan.md §Reliability):** no software can guarantee
> zero data loss under every device/power/storage condition. This module
> reduces risk with durable local writes, idempotent ingestion, auditability,
> and recovery paths. Do **not** describe it as "bug-free". Require the
> acceptance tests below before relying on it for a live race.

---

## 1. Roles & access

- **Admin / Event Manager** — configure races, assign checkpoints, review
  conflicts, finalize results, export backups. Enforced server-side by
  `requireRaceManager` (`src/lib/raceAuth.js`).
- **Official** — a signed-in user assigned to a checkpoint session. Records at
  `/race-control`. Can only act on their own assigned, open, non-expired
  session (`src/lib/raceAccess.js`).

## 2. Pre-event checklist (while online)

1. Create the race, categories and rider entries; assign unique numbers.
2. Admin → Race Management → open the race → **Verify / create indexes** on the
   dashboard (ensures the unique idempotency/number indexes exist in this
   environment). Do this once per environment before go-live.
3. Collect rider/bike/plate photos; generate and print plates.
4. **Lock** the race (Lifecycle → Lock). This freezes the config and generates
   the checksummed offline bundle. Any later config change bumps the config
   version and regenerates the bundle — devices must re-preflight.
5. Assign each official to a checkpoint (Checkpoints & Officials).
6. On each device, open `/race-control`, sign in, pick the session, and run
   **Preflight**. Confirm: checksum verified, roster loaded, persistent storage
   granted, clock calibrated. The device shows **Ready for offline operation**
   only when all mandatory checks pass.
7. **Export a backup** (⬇ Export backup) before the event starts.

## 3. During the event

- Officials record start / lap / finish / DNF. Each action shows a per-event
  state: **Saved on this device → Pending sync → Synced** (or **Needs review** /
  **Save failed**).
- Devices sync automatically on reconnect, when the tab regains focus, on a
  timer, and via **Sync now**. Offline is normal — events stay durable locally.
- Admin → Sync Health shows per-device sequence ranges, gaps, last reported
  pending counts and batch receipts. Admin → Conflicts shows items needing
  review.

## 4. Incident runbook (device problem)

Follow in order. **Do NOT clear site data, uninstall the PWA, or "reset" the
device** — queued local events live in IndexedDB and will sync once reconnected.

1. Identify the event, device and checkpoint session (Sync Health lists them).
2. Note the device's **last successful sync** and **last reported pending**
   count (may be stale — the server cannot see a device's current local queue).
3. Re-establish connectivity; the device retries automatically. Or tap
   **Sync now** on the device.
4. If the official re-authenticates (session expiry), sync resumes — no events
   are lost.
5. If a device is **lost/damaged/wiped**: in Checkpoints / Sync Health, **Revoke**
   the session so it can no longer sync when reachable. Any events that already
   reached the server are retained; events that never synced from a destroyed
   device cannot be recovered (use a second device / backup for critical laps).
6. Escalate unresolved payload/integrity conflicts to a Results Reviewer.
7. Preserve device and server audit logs until the incident is closed.

## 5. Conflicts & results

- The server recomputes conflicts and result projections after each sync batch,
  and on demand via **Recompute** on the Results page.
- Resolve or waive each conflict **with a reason** (audited). Source events are
  never deleted — resolving only closes the review item. Corrections/voids are
  new, authorized events.
- **Finalize** results only after open conflicts are resolved or explicitly
  waived with a reason. Reopening a completed race drops results back to
  provisional.

## 6. Backup & recovery

- **Server backup:** ⬇ Export backup downloads a JSON bundle (config, roster,
  append-only events, conflicts, results, audit log, sessions, receipts). Export
  before and after each event, and before any migration.
- **Restore / audit:** the export is the authoritative server-side record for
  reconciliation and dispute resolution. (Programmatic re-import is not provided
  by default — the append-only event log plus idempotent ingestion is the
  recovery mechanism; events re-sent by a device are de-duplicated by
  `clientEventId`.)
- **Indexes:** if a unique index fails to build, the ensure-indexes report names
  the collection — resolve duplicate data before enabling race operations. Never
  run destructive migrations against production without explicit authorization.

## 7. Known limitations (be honest with stakeholders)

- Independent offline devices cannot guarantee a globally correct event order by
  themselves; offline results are **provisional** until merged and reviewed.
- `navigator.onLine` is only a hint; reachability is proven by a successful sync.
- An offline device cannot learn of a session revocation until it reconnects;
  this is mitigated by short session expiries.
- A destroyed device's un-synced local events are unrecoverable — use a backup
  device or dedicated timing hardware for critical timing.
- `lastReportedPending` is what the device last told the server and may be stale.

## 8. Acceptance tests to run before a live race (plan §13.6)

Automated unit tests (`npm test`) cover the pure logic: hashing/idempotency,
checksum verification, input validation, authorization, history reduction,
result projection and conflict detection. The following must be exercised
**manually in a real browser + deployed environment** — they are not covered by
the unit suite:

- [ ] Record events offline, force-close and reopen the PWA — events survive and
      remain **Pending sync** (plan §13.2).
- [ ] Reconnect — pending events become **Synced**; nothing is lost or
      duplicated (retry the same batch; confirm `alreadyAccepted`).
- [ ] Two devices record for the same rider offline, then reconnect — both sets
      reconcile; conflicts are flagged, not silently dropped (plan §13.3).
- [ ] Same `clientEventId` with a different payload → integrity conflict, not an
      overwrite.
- [ ] Reload the page mid-sync; restart the device; exhaust storage quota — no
      event is marked synced without a server acknowledgement.
- [ ] Security: an official cannot access another event; an unassigned/revoked
      session is rejected on sync; cross-tenant/IDOR id guessing fails.
- [ ] A race completes end-to-end with all devices offline, then reconnects and
      reconciles, and an operator can export and recover the data.

Do not declare the module production-ready until these pass and a pilot event is
signed off by the race operations owner.
