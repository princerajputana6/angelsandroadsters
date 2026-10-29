import { defineConfig } from 'vitest/config';

// Unit tests target the PURE race logic (no DB, no browser): history
// reduction, result projection, conflict detection, authorization, hashing,
// checksum and input validation. DB/IndexedDB/HTTP integration and multi-device
// field tests are covered by the manual scenarios in the support runbook.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    globals: true,
  },
});
