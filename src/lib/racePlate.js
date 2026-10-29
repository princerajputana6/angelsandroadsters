import { connectDB } from './db';
import Race from './models/Race';
import Event from './models/Event';
import RaceCategory from './models/RaceCategory';
import RaceEntry from './models/RaceEntry';
import { generateQRDataUrl } from './qr';

/**
 * Build print-ready plate data for a race's entries (plan §5.4). The QR encodes
 * ONLY a non-sensitive entry identifier — never personal data (plan §5.4, §11).
 * The rider's public display name is preferred over the full legal name.
 */
function qrPayload(entry) {
  // Compact, non-PII token: type + entry id + number. No name, no contact.
  return JSON.stringify({ t: 'race-entry', id: String(entry._id), n: entry.raceNumber });
}

export async function buildPlates(raceId, entryIds) {
  await connectDB();
  const race = await Race.findById(raceId).lean();
  if (!race) throw Object.assign(new Error('Race not found'), { status: 404 });
  const event = await Event.findById(race.event).lean();

  const filter = { race: raceId, status: 'active' };
  if (Array.isArray(entryIds) && entryIds.length) filter._id = { $in: entryIds };

  const [entries, categories] = await Promise.all([
    RaceEntry.find(filter).sort({ raceNumber: 1 }).lean(),
    RaceCategory.find({ race: raceId }).lean(),
  ]);
  const catName = Object.fromEntries(categories.map((c) => [String(c._id), c.name]));

  const plates = await Promise.all(
    entries.map(async (e) => ({
      entryId: String(e._id),
      raceNumber: e.raceNumber,
      displayName: e.displayName || e.riderName,
      categoryName: e.category ? catName[String(e.category)] || '' : '',
      riderPhoto: e.photos?.rider?.url || '',
      platePrinted: !!e.platePrinted,
      qr: await generateQRDataUrl(qrPayload(e)),
    }))
  );

  return {
    race: { id: String(race._id), name: race.name },
    event: { id: String(event?._id || ''), title: event?.title || '' },
    plates,
  };
}
