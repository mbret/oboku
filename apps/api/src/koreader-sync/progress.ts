import type { KoreaderSyncProgressPostgresEntity } from "../features/postgres/entities"
import { createKoreaderSyncError } from "./errors"

const MAX_DOCUMENT_LENGTH = 128
const MAX_PROGRESS_LENGTH = 4096
const MAX_DEVICE_LENGTH = 256

// koreader-sync-server's read route binds `:document` to this class, so a
// document outside it could be stored but never read back.
const SERVABLE_DOCUMENT = /^[A-Za-z0-9_]+$/

export type ProgressUpdate = {
  document: string
  progress: string
  percentage: number
  device: string
  deviceId: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const isWithin = (value: string, maxLength: number) => value.length <= maxLength

// KOReader sends a page number rather than an xpointer for a book with pages.
const toProgress = (value: unknown) => {
  if (typeof value === "string") return value

  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : undefined
}

// koreader-sync-server reads it with Lua's `tonumber`, which takes a numeric
// string as well.
const toPercentage = (value: unknown) => {
  const percentage =
    typeof value === "string" && value.trim() !== "" ? Number(value) : value

  return typeof percentage === "number" && Number.isFinite(percentage)
    ? percentage
    : undefined
}

const toDeviceId = (value: unknown) => {
  if (value === undefined || value === null) return null

  return typeof value === "string" ? value : undefined
}

/**
 * The body of `PUT /syncs/progress`, refused the way koreader-sync-server
 * refuses it, plus length limits the reference server does not need since it
 * keeps nothing but the latest value in memory.
 */
export const parseProgressUpdate = (body: unknown): ProgressUpdate => {
  const fields = isRecord(body) ? body : {}
  const { document, device } = fields

  if (typeof document !== "string" || document.length === 0) {
    throw createKoreaderSyncError("documentMissing")
  }

  if (!SERVABLE_DOCUMENT.test(document)) {
    throw createKoreaderSyncError("documentNotServable")
  }

  const progress = toProgress(fields.progress)
  const percentage = toPercentage(fields.percentage)
  const deviceId = toDeviceId(fields.device_id)

  if (
    progress === undefined ||
    percentage === undefined ||
    typeof device !== "string" ||
    deviceId === undefined
  ) {
    throw createKoreaderSyncError("invalidRequest")
  }

  const isWithinLimits =
    isWithin(document, MAX_DOCUMENT_LENGTH) &&
    isWithin(progress, MAX_PROGRESS_LENGTH) &&
    isWithin(device, MAX_DEVICE_LENGTH) &&
    (deviceId === null || isWithin(deviceId, MAX_DEVICE_LENGTH))

  if (!isWithinLimits) throw createKoreaderSyncError("invalidRequest")

  return { document, progress, percentage, device, deviceId }
}

/** koreader-sync-server's timestamps are Unix seconds. */
export const toSyncTimestamp = (date: Date) => Math.floor(date.getTime() / 1000)

export const toProgressResponse = ({
  document,
  percentage,
  progress,
  device,
  device_id,
  updated_at,
}: KoreaderSyncProgressPostgresEntity) => ({
  document,
  percentage,
  progress,
  device,
  ...(device_id !== null && { device_id }),
  timestamp: toSyncTimestamp(updated_at),
})
