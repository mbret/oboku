import type { AuthSession } from "../auth/types"
import { Logger } from "../debug/logger.shared"
import { getProfileRow, putProfileRow } from "./dbHelpers"
import { getProfile, setProfile } from "./active/activeProfile"

/**
 * Key under which the pre-migration reactjrx auth signal was persisted. The
 * value is a shared-store envelope keyed by the signal key ("authState"), whose
 * `value` field holds the {@link AuthSession}. See reactjrx `persistValue`.
 */
const LEGACY_AUTH_STORAGE_KEY = "auth"
const LEGACY_AUTH_SIGNAL_KEY = "authState"

const isAuthSession = (value: unknown): value is AuthSession => {
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

const readLegacyAuthSession = (): AuthSession | undefined => {
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

  return isAuthSession(value) ? value : undefined
}

const runMigration = async () => {
  const auth = readLegacyAuthSession()

  if (!auth) return

  const existing = await getProfileRow(auth.nameHex)

  if (!existing) {
    await putProfileRow({ id: auth.nameHex, ...auth })
  }

  if (!getProfile()) {
    setProfile(auth.nameHex)
  }

  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
}

let migrationPromise: Promise<void> | null = null

/**
 * One-time, idempotent import of the pre-migration `localStorage` auth into the
 * `profiles` table so a logged-in user is not signed out on deploy. Awaited by
 * the auth query so it always resolves against a migrated table.
 */
export const migrateLegacyAuth = () => {
  if (!migrationPromise) {
    migrationPromise = runMigration().catch((error) => {
      Logger.error("Failed to migrate legacy auth", error)
    })
  }

  return migrationPromise
}
