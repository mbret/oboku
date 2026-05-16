import {
  parseComicInfo,
  parseOpf,
  resolveArchiveMetadata,
  type ArchiveResolveResult,
} from "@prose-reader/archive-parser"
import type { ArchiveEntry, ArchiveSource } from "./archive/types"
import { findComicInfoEntry } from "./comicInfo"
import { findOpfEntry } from "./opf/read"

/**
 * Extensions this reader considers as "images" — both for picking the
 * fallback cover when no OPF cover is declared, and for counting pages
 * in comic archives. Covers every raster format real-world CBZ/CBR/EPUB
 * producers actually use; anything downstream (e.g. the API's `sharp`
 * pipeline) can normalize these to a delivery format of its own.
 *
 * Kept internal on purpose: "what is an image inside a book archive?"
 * is a concern that belongs in this package, not something each caller
 * should redefine and risk drifting on.
 */
const IMAGE_EXTENSIONS: ReadonlySet<string> = new Set([
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

const getExtension = (path: string): string => {
  const lastDot = path.lastIndexOf(".")
  const lastSlash = path.lastIndexOf("/")

  if (lastDot === -1 || lastDot < lastSlash) return ""

  return path.substring(lastDot).toLowerCase()
}

const isImageEntry = (entry: ArchiveEntry): boolean =>
  IMAGE_EXTENSIONS.has(getExtension(entry.path))

/**
 * Source-agnostic view of every metadata container we can extract from
 * a single archive. Container-specific metadata is kept separate so
 * callers choose their own precedence per field.
 *
 * `hasOpf`/`hasComicInfo` describe *what metadata containers the
 * archive actually carries* — not what kind of archive it is. A CBZ
 * can carry ComicInfo, an EPUB can carry ComicInfo alongside its OPF,
 * a raw image dump can carry neither. Consumers decide for themselves
 * what combinations they're willing to act on; "is this archive
 * recognized?" is simply `hasOpf || hasComicInfo`.
 */
export type ArchiveMetadata = {
  /** `true` when the archive exposed an OPF package document. */
  hasOpf: boolean
  /** `true` when the archive exposed a ComicInfo.xml at the root. */
  hasComicInfo: boolean
  opf?: ArchiveResolveResult | undefined
  comicInfo?: ArchiveResolveResult | undefined
  /**
   * Archive-relative path to the cover. For EPUBs this is the OPF
   * cover with its folder prefix resolved; for other archives it's
   * the first image entry in alphabetic order. `undefined` when the
   * archive has no recognizable cover asset.
   */
  coverHref?: string | undefined
  /**
   * Best-effort page count:
   *  - EPUBs (has OPF): undefined; reader-position counts are a client
   *    concern.
   *  - Other archives (CBZ/CBR/loose image archives): number of image
   *    entries in the archive.
   *
   * `undefined` when neither signal is available (e.g. a non-EPUB archive
   * with no image entries).
   */
  pageCount?: number | undefined
}

export type ReadArchiveMetadataEvents = {
  onOpfRead?: (event: { path: string; xml: string }) => void
  onComicInfoRead?: (event: { path: string; xml: string }) => void
}

export const readArchiveMetadata = async (
  source: ArchiveSource,
  events?: ReadArchiveMetadataEvents,
): Promise<ArchiveMetadata> => {
  const entries = await source.listEntries()
  const fileEntries = entries.filter((entry) => !entry.isDir)

  const opfEntry = await findOpfEntry({
    listEntries: () => Promise.resolve(entries),
  })
  const comicInfoEntry = await findComicInfoEntry({
    listEntries: () => Promise.resolve(entries),
  })

  const opfResult = opfEntry ? await loadOpf(opfEntry, events) : undefined
  const comicInfoResult = comicInfoEntry
    ? await loadComicInfo(comicInfoEntry, events)
    : undefined

  const imageEntries = fileEntries.filter(isImageEntry)

  const coverHref =
    resolveOpfCover(opfResult) ?? resolveFallbackCover(imageEntries)
  const pageCount = resolvePageCount({
    hasOpf: opfResult !== undefined,
    imageEntryCount: imageEntries.length,
  })

  return {
    hasOpf: opfResult !== undefined,
    hasComicInfo: comicInfoResult !== undefined,
    opf: opfResult?.metadata,
    comicInfo: comicInfoResult,
    coverHref,
    pageCount,
  }
}

/**
 * Decide which signal represents the "page count" for this archive.
 * EPUB reading-position counts are left to clients that need them; for
 * anything else (comics, loose image archives) we fall back to the
 * image-entry count, which is what comic readers use as a page number.
 */
const resolvePageCount = ({
  hasOpf,
  imageEntryCount,
}: {
  hasOpf: boolean
  imageEntryCount: number
}): number | undefined => {
  if (hasOpf) return undefined

  return imageEntryCount > 0 ? imageEntryCount : undefined
}

const loadOpf = async (
  entry: ArchiveEntry,
  events: ReadArchiveMetadataEvents | undefined,
) => {
  const xml = await entry.readAsString()

  events?.onOpfRead?.({ path: entry.path, xml })

  const parsed = parseOpf(xml)
  const metadata = resolveArchiveMetadata(parsed)
  const lastSlash = entry.path.lastIndexOf("/")
  const basePath = lastSlash === -1 ? "" : entry.path.substring(0, lastSlash)

  return { metadata, basePath, coverHref: parsed.coverHref }
}

const loadComicInfo = async (
  entry: ArchiveEntry,
  events: ReadArchiveMetadataEvents | undefined,
) => {
  const xml = await entry.readAsString()

  events?.onComicInfoRead?.({ path: entry.path, xml })

  return resolveArchiveMetadata(parseComicInfo(xml))
}

const resolveOpfCover = (
  opf: { basePath: string; coverHref: string | undefined } | undefined,
): string | undefined => {
  if (!opf?.coverHref) return undefined

  return opf.basePath !== ""
    ? `${opf.basePath}/${opf.coverHref}`
    : opf.coverHref
}

const resolveFallbackCover = (
  imageEntries: ArchiveEntry[],
): string | undefined => {
  const images = imageEntries
    .map((entry) => entry.path)
    .sort((a, b) => a.localeCompare(b))

  return images[0]
}
