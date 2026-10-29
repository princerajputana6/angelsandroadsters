'use client';

/**
 * Compute the SHA-256 content hash of a File/Blob in the browser via Web Crypto.
 * Used to give each uploaded race photo a stable content hash for retry/dedupe
 * and later integrity verification (plan §5.3). This is also the foundation the
 * M3 offline asset-upload queue builds on.
 */
export async function sha256OfFile(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Lightweight client-side validation mirroring the server's upload checks, so we
// fail fast with a clear message before sending bytes over the wire.
export function validateImageFile(file, { maxBytes = 5 * 1024 * 1024 } = {}) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) return 'Please choose a JPG, PNG or WebP image.';
  if (file.size > maxBytes) return `Image must be under ${Math.round(maxBytes / 1024 / 1024)} MB.`;
  return null;
}
