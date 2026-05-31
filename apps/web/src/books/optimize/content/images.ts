import type JSZip from "jszip"

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

export const replaceExtensionWithWebp = (path: string): string => {
  const extension = getExtension(path)

  if (extension === "" || extension === WEBP_EXTENSION) return path

  return `${path.substring(0, path.length - extension.length)}${WEBP_EXTENSION}`
}

/**
 * JSZip keeps the uncompressed size on a private `_data` field that its
 * published types deliberately omit. Reading it avoids decoding every entry
 * just to measure a content report, which would be prohibitive for large
 * comic archives.
 */
type JSZipObjectWithData = JSZip.JSZipObject & {
  _data?: { uncompressedSize?: number }
}

export const getUncompressedSize = (
  entry: JSZip.JSZipObject,
): number | undefined => {
  // Accessing JSZip's untyped private `_data` to read the uncompressed size
  // without decoding the entry; see JSZipObjectWithData above.
  const withData = entry as JSZipObjectWithData

  return withData._data?.uncompressedSize
}

export type ArchiveImageEntry = {
  path: string
  size: number | undefined
  entry: JSZip.JSZipObject
}

export const listImageEntries = (zip: JSZip): ArchiveImageEntry[] =>
  Object.values(zip.files)
    .filter((entry) => !entry.dir && isImagePath(entry.name))
    .map((entry) => ({
      path: entry.name,
      size: getUncompressedSize(entry),
      entry,
    }))

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
  entries: ArchiveImageEntry[],
  sampleSize: number = RESOLUTION_SAMPLE_SIZE,
): Promise<ImageResolution | undefined> => {
  if (entries.length === 0) return undefined

  const step = Math.max(1, Math.floor(entries.length / sampleSize))
  const sample = entries
    .filter((_, index) => index % step === 0)
    .slice(0, sampleSize)

  let totalWidth = 0
  let totalHeight = 0
  let measured = 0

  for (const { entry } of sample) {
    try {
      const bitmap = await createImageBitmap(await entry.async("blob"))
      totalWidth += bitmap.width
      totalHeight += bitmap.height
      bitmap.close()
      measured += 1
    } catch {
      // Undecodable formats (e.g. AVIF on some browsers) are skipped.
    }
  }

  if (measured === 0) return undefined

  return {
    width: Math.round(totalWidth / measured),
    height: Math.round(totalHeight / measured),
  }
}
