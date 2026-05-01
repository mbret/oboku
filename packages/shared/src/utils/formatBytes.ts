/**
 * Format a byte count as a short human-readable string (e.g. "1.4 MB").
 *
 * Accepts a `number` or a `string` because storage providers disagree on
 * the wire shape (Google Drive returns size as text, MS Graph / Synology
 * / Node `fs.Stats` return numbers — see {@link BookMetadata.size}).
 * Returns `undefined` for nullish, empty, non-numeric or negative inputs
 * so callers can render a fallback.
 *
 * Uses decimal units (1000-based) to match the conventions of the
 * surfaces oboku users see elsewhere: macOS Finder, iOS / Android
 * Storage screens, Google Drive, OneDrive, Dropbox, and the byte
 * counts reported by `navigator.storage.estimate()` and the cloud
 * providers we ingest metadata from. Use IEC units (KiB / MiB / GiB)
 * if a binary representation is ever needed.
 */
export function formatBytes(
  bytes: number | string | null | undefined,
): string | undefined {
  if (bytes === null || bytes === undefined || bytes === "") return undefined

  const value = typeof bytes === "string" ? Number(bytes) : bytes
  if (!Number.isFinite(value) || value < 0) return undefined

  if (value < 1000) return `${value} B`
  if (value < 1000 ** 2) return `${(value / 1000).toFixed(1)} KB`
  if (value < 1000 ** 3) return `${(value / 1000 ** 2).toFixed(1)} MB`
  return `${(value / 1000 ** 3).toFixed(1)} GB`
}
