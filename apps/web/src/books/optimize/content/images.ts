import {
  isFileRecord,
  type Archive,
  type ArchiveFileRecord,
} from "@oboku/archive-metadata"

export const IMAGE_EXTENSIONS: ReadonlySet<string> = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".bmp",
  ".tif",
  ".tiff",
])

export const WEBP_EXTENSION = ".webp"

/**
 * Subset of {@link IMAGE_EXTENSIONS} we convert to WebP. Restricted to static
 * raster formats the canvas pipeline both decodes reliably and improves:
 *  - `.gif`, `.webp`, `.avif` can be animated; `createImageBitmap` only decodes
 *    the first frame, so converting them would flatten the animation;
 *  - `.tif`/`.tiff` aren't decodable by browsers, so conversion would fail.
 *
 * Excluded formats are still counted as images everywhere else — they are just
 * left untouched by compression.
 */
const CONVERTIBLE_IMAGE_EXTENSIONS: ReadonlySet<string> = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".bmp",
])

/**
 * Human-readable names of the formats {@link isConvertibleImagePath} accepts,
 * derived from the same allowlist so UI copy cannot drift from the actual
 * conversion behavior.
 */
export const CONVERTIBLE_IMAGE_FORMAT_NAMES: readonly string[] = [
  ...CONVERTIBLE_IMAGE_EXTENSIONS,
].map((extension) => extension.slice(1).toUpperCase())

export const getExtension = (path: string): string => {
  const lastDot = path.lastIndexOf(".")
  const lastSlash = path.lastIndexOf("/")

  if (lastDot === -1 || lastDot < lastSlash) return ""

  return path.substring(lastDot).toLowerCase()
}

export const getBasename = (path: string): string => {
  const lastSlash = path.lastIndexOf("/")

  return lastSlash === -1 ? path : path.substring(lastSlash + 1)
}

export const isImagePath = (path: string): boolean =>
  IMAGE_EXTENSIONS.has(getExtension(path))

export const isConvertibleImagePath = (path: string): boolean =>
  CONVERTIBLE_IMAGE_EXTENSIONS.has(getExtension(path))

export const replaceExtensionWithWebp = (path: string): string => {
  const extension = getExtension(path)

  if (extension === "" || extension === WEBP_EXTENSION) return path

  return `${path.substring(0, path.length - extension.length)}${WEBP_EXTENSION}`
}

export const listImageEntries = (archive: Archive): ArchiveFileRecord[] =>
  archive.records
    .filter(isFileRecord)
    .filter((record) => isImagePath(record.uri))

export type ImageResolution = {
  width: number
  height: number
}

const RESOLUTION_SAMPLE_SIZE = 24

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

  const resolutions = await Promise.all(
    sample.map(async (record): Promise<ImageResolution | undefined> => {
      try {
        const bitmap = await createImageBitmap(await record.blob())
        const resolution = { width: bitmap.width, height: bitmap.height }
        bitmap.close()

        return resolution
      } catch {
        // Undecodable formats (e.g. AVIF on some browsers) are skipped.
        return undefined
      }
    }),
  )

  const measured = resolutions.filter(
    (resolution): resolution is ImageResolution => resolution !== undefined,
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
