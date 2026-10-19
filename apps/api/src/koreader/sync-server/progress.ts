import type { KoreaderSyncProgressPostgresEntity } from "../../features/postgres/entities.js"
import {
  KOREADER_SYNC_SERVABLE_DOCUMENT,
  toSyncDeviceId,
  toSyncFields,
  toSyncPercentage,
  toSyncProgress,
  toSyncTimestamp,
} from "../protocol.js"
import { createKoreaderSyncError } from "./errors.js"

const MAX_DOCUMENT_LENGTH = 128
const MAX_PROGRESS_LENGTH = 4096
const MAX_DEVICE_LENGTH = 256

export type ProgressUpdate = {
  document: string
  progress: string
  percentage: number
  device: string
  deviceId: string | null
}

const isWithin = (value: string, maxLength: number) => value.length <= maxLength

/**
 * The body of `PUT /syncs/progress`, refused the way koreader-sync-server
 * refuses it, plus length limits the reference server does not need since it
 * keeps nothing but the latest value in memory.
 */
export const parseProgressUpdate = (body: unknown): ProgressUpdate => {
  const fields = toSyncFields(body)
  const { document, device } = fields

  if (typeof document !== "string" || document.length === 0) {
    throw createKoreaderSyncError("documentMissing")
  }

  if (!KOREADER_SYNC_SERVABLE_DOCUMENT.test(document)) {
    throw createKoreaderSyncError("documentNotServable")
  }

  const progress = toSyncProgress(fields.progress)
  const percentage = toSyncPercentage(fields.percentage)
  const deviceId = toSyncDeviceId(fields.device_id)

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
