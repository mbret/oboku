import type { Archive, ArchiveFileRecord } from "../archive/types"
import { isFileRecord } from "../archive/types"
import { mapWithConcurrency } from "../utils/mapWithConcurrency"
import { isImagePath } from "./paths"

export const listImageEntries = (archive: Archive): ArchiveFileRecord[] =>
  archive.records
    .filter(isFileRecord)
    .filter((record) => isImagePath(record.uri))

export type ImageResolution = {
  width: number
  height: number
}

const RESOLUTION_SAMPLE_SIZE = 24
const RESOLUTION_MEASURE_CONCURRENCY = 2

/**
 * Estimates the typical image resolution by decoding an evenly spaced sample
 * rather than every entry, keeping inspection cheap for archives with hundreds
 * of pages.
 */
export const measureAverageImageResolution = async (
  records: ArchiveFileRecord[],
  sampleSize: number = RESOLUTION_SAMPLE_SIZE,
): Promise<ImageResolution | undefined> => {
  if (records.length === 0) return undefined

  const step = Math.max(1, Math.floor(records.length / sampleSize))
  const sample = records
    .filter((_, index) => index % step === 0)
    .slice(0, sampleSize)

  const measured: ImageResolution[] = []

  await mapWithConcurrency(
    sample,
    RESOLUTION_MEASURE_CONCURRENCY,
    async function measureImageResolution(record) {
      try {
        const bitmap = await createImageBitmap(await record.blob())
        measured.push({ width: bitmap.width, height: bitmap.height })
        bitmap.close()
      } catch {
        // Undecodable formats (e.g. AVIF on some browsers) are skipped.
      }
    },
  )

  if (measured.length === 0) return undefined

  return {
    width: Math.round(
      measured.reduce((total, { width }) => total + width, 0) / measured.length,
    ),
    height: Math.round(
      measured.reduce((total, { height }) => total + height, 0) /
        measured.length,
    ),
  }
}
