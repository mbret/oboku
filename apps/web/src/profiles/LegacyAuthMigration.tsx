import { memo, type ReactNode, useEffect, useState } from "react"
import type { Profile } from "./types"
import { Logger } from "../debug/logger.shared"
import {
  activeProfileIdSignal,
  getProfile,
  setProfile,
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

type LegacyProfile = Omit<Profile, "id">

const isLegacyProfile = (value: unknown): value is LegacyProfile => {
  if (typeof value !== "object" || value === null) return false

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.accessToken === "string" &&
    typeof candidate.refreshToken === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.nameHex === "string" &&
    typeof candidate.dbName === "string"
  )
}

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

  const envelope =
    typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)[LEGACY_AUTH_SIGNAL_KEY]
      : undefined

  const value =
    typeof envelope === "object" && envelope !== null
      ? (envelope as Record<string, unknown>).value
      : undefined

  return isLegacyProfile(value) ? value : undefined
}

const runMigration = async () => {
  const auth = readLegacyProfile()

  if (!auth) return

  const existing = await dexieDb.profiles.get(auth.nameHex)

  if (!existing) {
    await dexieDb.profiles.put({ id: auth.nameHex, ...auth })
  }

  if (!getProfile()) {
    setProfile(auth.nameHex)
    activeProfileIdSignal.update(auth.nameHex)
  }

  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
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
