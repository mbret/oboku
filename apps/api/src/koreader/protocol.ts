import { createHash } from "node:crypto"

/** The media type KOReader's sync client accepts (its `api.json`). */
export const KOREADER_SYNC_MEDIA_TYPE = "application/vnd.koreader.v1+json"

export const KOREADER_SYNC_USERNAME_HEADER = "x-auth-user"
export const KOREADER_SYNC_KEY_HEADER = "x-auth-key"

export const KOREADER_SYNC_REGISTER_ROUTE = "users/create"
export const KOREADER_SYNC_AUTHORIZE_ROUTE = "users/auth"
export const KOREADER_SYNC_PROGRESS_ROUTE = "syncs/progress"
export const KOREADER_SYNC_HEALTHCHECK_ROUTE = "healthcheck"

/** The `x-auth-key` a KOReader sync client sends for a password. */
export const toSyncKey = (password: string) =>
  createHash("md5").update(password).digest("hex")
