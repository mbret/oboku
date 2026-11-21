import { memo, type ReactNode, useEffect, useState } from "react"
import { Logger } from "../debug/logger.shared"
import { dexieDb } from "../rxdb/dexie"

/**
 * Backfills a throwaway `sessionId` onto any profile row persisted before
 * session-scoped logout, so `Profile.sessionId` is always present. A backfilled
 * id matches no server session, so the logout sweep's revoke call harmlessly
 * no-ops (the server session is already inert after sign-out and dies by TTL);
 * a live session gets a real id again on its next sign-in.
 *
 * TODO(legacy, ~2027-01): remove once refresh tokens issued before this column
 * (server TTL is 6 months) have all expired and no profile row can predate it.
 */
const backfillMissingSessionIds = async () => {
  const profiles = await dexieDb.profiles.toArray()

  await Promise.all(
    profiles
      // `sessionId` is typed required, but rows written by older builds lack it
      // at runtime — this is that boundary.
      .filter((profile) => !profile.sessionId)
      .map((profile) =>
        dexieDb.profiles.update(profile.id, {
          sessionId: crypto.randomUUID(),
        }),
      ),
  )
}

let migrationPromise: Promise<void> | null = null

const migrateLegacyAuth = () => {
  if (!migrationPromise) {
    migrationPromise = backfillMissingSessionIds().catch((error) => {
      Logger.error("Failed to migrate legacy auth", error)
    })
  }

  return migrationPromise
}

/**
 * Boot boundary that runs the one-time legacy-auth backfill before any profile
 * or auth state is read. Temporary shim, removed with
 * `backfillMissingSessionIds`.
 */
export const LegacyAuthMigration = memo(function LegacyAuthMigration({
  children,
}: {
  children: ReactNode
}) {
  const [isMigrated, setIsMigrated] = useState(false)

  useEffect(function runLegacyAuthMigrationOnce() {
    let isMounted = true

    migrateLegacyAuth().then(function markMigrated() {
      if (isMounted) setIsMigrated(true)
    })

    return function cancelMigrationStateUpdate() {
      isMounted = false
    }
  }, [])

  if (!isMigrated) {
    return null // no need for splash, its very fast.
  }

  return <>{children}</>
})
