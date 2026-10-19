import { createHash } from "node:crypto"

/** The media type KOReader's sync client accepts (its `api.json`). */
export const KOREADER_SYNC_MEDIA_TYPE = "application/vnd.koreader.v1+json"

export const KOREADER_SYNC_USERNAME_HEADER = "x-auth-user"
export const KOREADER_SYNC_KEY_HEADER = "x-auth-key"

export const KOREADER_SYNC_REGISTER_ROUTE = "users/create"
export const KOREADER_SYNC_AUTHORIZE_ROUTE = "users/auth"
export const KOREADER_SYNC_PROGRESS_ROUTE = "syncs/progress"
export const KOREADER_SYNC_HEALTHCHECK_ROUTE = "healthcheck"

// koreader-sync-server's read route binds `:document` to this class, so a
// document outside it could be stored but never read back.
export const KOREADER_SYNC_SERVABLE_DOCUMENT = /^[A-Za-z0-9_]+$/

/** The `x-auth-key` a KOReader sync client sends for a password. */
export const toSyncKey = (password: string) =>
  createHash("md5").update(password).digest("hex")

/** koreader-sync-server's timestamps are Unix seconds. */
export const toSyncTimestamp = (date: Date) => Math.floor(date.getTime() / 1000)

export const fromSyncTimestamp = (timestamp: number) =>
  new Date(timestamp * 1000)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

/** The fields of a sync request or answer, none when its body is not an object. */
export const toSyncFields = (body: unknown): Record<string, unknown> =>
  isRecord(body) ? body : {}

// KOReader sends a page number rather than an xpointer for a book with pages.
export const toSyncProgress = (value: unknown) => {
  if (typeof value === "string") return value

  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : undefined
}

// koreader-sync-server reads it with Lua's `tonumber`, which takes a numeric
// string as well.
export const toSyncPercentage = (value: unknown) => {
  const percentage =
    typeof value === "string" && value.trim() !== "" ? Number(value) : value

  return typeof percentage === "number" && Number.isFinite(percentage)
    ? percentage
    : undefined
}

export const toSyncDeviceId = (value: unknown) => {
  if (value === undefined || value === null) return null

  return typeof value === "string" ? value : undefined
}
