// Client-safe booking constants (no server-only deps, so this is safe to
// import from both API routes/models and 'use client' components).

// A guest may book 1..MAX_BOOKING_NIGHTS nights, further capped by the
// resort's own fixed stay window.
export const MAX_BOOKING_NIGHTS = 3;
