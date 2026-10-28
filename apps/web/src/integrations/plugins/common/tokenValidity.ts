export function hasMinimumValidityLeft({
  expiresAt,
  minimumValidityMs,
  now = Date.now(),
}: {
  expiresAt: Date | number | null | undefined
  minimumValidityMs: number
  now?: number
}) {
  if (minimumValidityMs <= 0) {
    return true
  }

  if (expiresAt === null || expiresAt === undefined) {
    return false
  }

  const expirationTime =
    expiresAt instanceof Date ? expiresAt.getTime() : expiresAt

  if (!Number.isFinite(expirationTime)) {
    return false
  }

  return expirationTime - now >= minimumValidityMs
}
