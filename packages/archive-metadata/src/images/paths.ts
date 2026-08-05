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

export const isImagePath = (path: string): boolean =>
  IMAGE_EXTENSIONS.has(getExtension(path))

export const isConvertibleImagePath = (path: string): boolean =>
  CONVERTIBLE_IMAGE_EXTENSIONS.has(getExtension(path))

export const replaceExtensionWithWebp = (path: string): string => {
  const extension = getExtension(path)

  if (extension === "" || extension === WEBP_EXTENSION) return path

  return `${path.substring(0, path.length - extension.length)}${WEBP_EXTENSION}`
}
