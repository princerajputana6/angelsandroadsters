import { z } from 'zod';

/**
 * Strict input validation at the API boundary (plan §8.3, §11). Uses zod,
 * which is already a project dependency. `parseOrThrow` converts a validation
 * failure into the app's standard 400 error shape handled by apiUtils.handler.
 */
export function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues
      .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join('; ');
    throw Object.assign(new Error(msg || 'Invalid input'), { status: 400 });
  }
  return result.data;
}

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'invalid id');

// ---------------------------------------------------------------- Race
export const raceCreateSchema = z.object({
  event: objectId,
  name: z.string().trim().min(1).max(160),
  startModel: z.enum(['individual', 'common']).optional(),
  finishType: z.enum(['laps', 'time']).optional(),
  expectedLaps: z.number().int().min(0).max(1000).optional(),
  durationMinutes: z.number().int().min(0).max(100000).optional(),
  allowedCheckpoints: z.array(z.string().trim().min(1)).max(100).optional(),
  minLapDurationMs: z.number().int().min(0).optional(),
  maxLapDurationMs: z.number().int().min(0).optional(),
  finishRule: z.string().max(2000).optional(),
  penaltyRules: z.string().max(2000).optional(),
  dnfRules: z.string().max(2000).optional(),
  correctionAllowed: z.boolean().optional(),
  correctionApprovals: z.number().int().min(1).max(2).optional(),
  numberUniquenessScope: z.enum(['race', 'category', 'event']).optional(),
});

// All fields optional on update; status transitions handled by dedicated routes.
export const raceUpdateSchema = raceCreateSchema.partial().omit({ event: true });

// ---------------------------------------------------------------- Category
export const categoryCreateSchema = z.object({
  race: objectId,
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().max(40).optional(),
  criteria: z
    .object({
      gender: z.enum(['any', 'male', 'female', 'other']).optional(),
      ageMin: z.number().int().min(0).max(120).optional(),
      ageMax: z.number().int().min(0).max(120).optional(),
      engineCcMax: z.number().int().min(0).optional(),
      experience: z.string().max(80).optional(),
    })
    .optional(),
  numberRangeStart: z.number().int().min(0).optional(),
  numberRangeEnd: z.number().int().min(0).optional(),
  sortOrder: z.number().int().optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial().omit({ race: true });

// ---------------------------------------------------------------- Entry
const assetRefInput = z
  .object({
    url: z.string().url().max(1000).optional(),
    assetId: z.string().max(100).optional(),
    contentHash: z.string().max(128).optional(),
    status: z.enum(['none', 'pending', 'uploaded', 'verified']).optional(),
  })
  .optional();

export const entryCreateSchema = z.object({
  race: objectId,
  category: objectId.optional(),
  rider: objectId.optional(),
  registration: objectId.optional(),
  riderName: z.string().trim().min(1).max(160),
  displayName: z.string().trim().max(160).optional(),
  raceNumber: z.number().int().min(0).max(100000),
  bike: z
    .object({
      make: z.string().max(80).optional(),
      model: z.string().max(80).optional(),
      cc: z.string().max(40).optional(),
      description: z.string().max(500).optional(),
    })
    .optional(),
  photos: z
    .object({ rider: assetRefInput, bike: assetRefInput, plate: assetRefInput })
    .optional(),
  consentStatus: z.enum(['n/a', 'pending', 'given']).optional(),
});

export const entryUpdateSchema = entryCreateSchema.partial().omit({ race: true });

// ---------------------------------------------------------------- Rider pool
export const riderCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  displayName: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(160).optional().or(z.literal('')),
  user: objectId.optional(),
  bike: z
    .object({
      make: z.string().max(80).optional(),
      model: z.string().max(80).optional(),
      cc: z.string().max(40).optional(),
      description: z.string().max(500).optional(),
    })
    .optional(),
  photo: assetRefInput,
  notes: z.string().max(1000).optional(),
});

export const riderUpdateSchema = riderCreateSchema.partial();

// Bulk onboard pool riders into a race.
export const bulkAddSchema = z.object({
  race: objectId,
  riderIds: z.array(objectId).min(1).max(500),
  startNumber: z.number().int().min(0).max(100000).optional(),
  category: objectId.optional(),
});

export { objectId };
