import { Logger } from "@nestjs/common"

const logger = new Logger("tolerateMissingUserDb")

/**
 * Per-user-DB defensive wrapper for migration loops that iterate over
 * `_users`.
 *
 * Why this exists:
 * - `_users` can contain entries whose corresponding `userdb-*` database has
 *   been deleted (or never created, e.g. half-failed signup), producing
 *   orphans.
 * - `listUserDatabases()` already filters known orphans at discovery time,
 *   but a per-user database can still be deleted between discovery and
 *   iteration. This wrapper closes that race.
 *
 * Lives under `migrations/` because migrations are currently the only
 * caller. Promote to a shared location only when a second concern needs the
 * same behavior.
 *
 * Only the very specific CouchDB "Database does not exist." 404 is
 * swallowed. Any other failure (missing index, auth error, malformed
 * selector, etc.) is rethrown so real bugs are not silently dropped.
 */
export const tolerateMissingUserDb = async <T>(
  email: string,
  fn: () => Promise<T>,
): Promise<T | null> => {
  try {
    return await fn()
  } catch (err: unknown) {
    if (isMissingDbError(err)) {
      logger.warn(`User database vanished mid-iteration for ${email}, skipping`)
      return null
    }
    throw err
  }
}

const isMissingDbError = (err: unknown): boolean => {
  if (typeof err !== "object" || err === null) return false
  const candidate = err as { statusCode?: number; reason?: string }
  return (
    candidate.statusCode === 404 &&
    candidate.reason === "Database does not exist."
  )
}
