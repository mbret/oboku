import { memo, type ReactNode, useEffect, useState } from "react"
import type { Profile } from "./types"
import { Logger } from "../debug/logger.shared"
import {
  getActiveProfileId,
  setActiveProfileId,
} from "./active/activeProfileId"
import { dexieDb } from "../rxdb/dexie"

/**
 * Key under which the pre-migration reactjrx auth signal was persisted. The
 * value is a shared-store envelope keyed by the signal key ("authState"), whose
 * `value` field holds the legacy session (a {@link Profile} without its `id`).
 * See reactjrx `persistValue`.
 */
const LEGACY_AUTH_STORAGE_KEY = "auth"
const LEGACY_AUTH_SIGNAL_KEY = "authState"

type LegacyProfile = Omit<Profile, "id"> & {
  accessToken?: string
  refreshToken?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const isLegacyProfile = (value: unknown): value is LegacyProfile =>
  isRecord(value) &&
  typeof value.accessToken === "string" &&
  typeof value.refreshToken === "string" &&
  typeof value.email === "string" &&
  typeof value.nameHex === "string" &&
  typeof value.dbName === "string"

const readLegacyProfile = (): LegacyProfile | undefined => {
  const raw = localStorage.getItem(LEGACY_AUTH_STORAGE_KEY)

  if (!raw) return undefined

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    Logger.error("Failed to parse legacy auth for migration", error)

    return undefined
  }

  const envelope = isRecord(parsed) ? parsed[LEGACY_AUTH_SIGNAL_KEY] : undefined

  const value = isRecord(envelope) ? envelope.value : undefined

  return isLegacyProfile(value) ? value : undefined
}

const importLegacyLocalStorageAuth = async () => {
  const auth = readLegacyProfile()

  if (!auth) return

  const existing = await dexieDb.profiles.get(auth.nameHex)

  if (!existing) {
    // The legacy tokens are dropped, not copied: auth now rides on httpOnly
    // cookies, so this session cannot be resumed — the first authenticated
    // request fails and the user re-logs in, with all local data intact.
    await dexieDb.profiles.put({
      id: auth.nameHex,
      email: auth.email,
      nameHex: auth.nameHex,
      dbName: auth.dbName,
      sessionId: crypto.randomUUID(),
    })
  }

  if (!getActiveProfileId()) {
    setActiveProfileId(auth.nameHex)
  }

  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
}

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

const runMigration = async () => {
  await importLegacyLocalStorageAuth()
  await backfillMissingSessionIds()
}

let migrationPromise: Promise<void> | null = null

/**
 * One-time, idempotent import of the pre-migration `localStorage` auth into the
 * `profiles` table so a logged-in user is not signed out on deploy. Awaited by
 * the auth query so it always resolves against a migrated table.
 */
const migrateLegacyAuth = () => {
  if (!migrationPromise) {
    migrationPromise = runMigration().catch((error) => {
      Logger.error("Failed to migrate legacy auth", error)
    })
  }

  return migrationPromise
}

/**
 * Boot boundary that runs the one-time legacy-auth import before any profile or
 * auth state is read, so a logged-in user from a pre-migration build is not
 * signed out on deploy. Temporary shim — remove once the legacy localStorage
 * auth format is no longer in the wild.
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
