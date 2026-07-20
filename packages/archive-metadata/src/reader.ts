import {
  type ArchiveReadingOrderItem,
  type ResolvedMetadata,
  parseComicInfo,
  parseOpf,
  readRecordAsText,
  resolveArchiveCover,
  resolveArchiveMetadata,
  resolveArchiveReadingOrder,
} from "@prose-reader/archive-reader"
import type { Archive, ArchiveFileRecord } from "./archive/types"
import { findComicInfoEntry } from "./comicInfo"
import { findOpfEntry } from "./opf/read"

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
  opf?: ResolvedMetadata | undefined
  comicInfo?: ResolvedMetadata | undefined
  /**
   * Archive-relative path to the cover, as resolved by prose-reader:
   * the OPF-declared cover (folder prefix applied) when present,
   * otherwise the first image in the archive's reading order.
   * `undefined` when the archive has no recognizable cover asset.
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
  archive: Archive,
  events?: ReadArchiveMetadataEvents,
): Promise<ArchiveMetadata> => {
  const opfEntry = findOpfEntry(archive)
  const comicInfoEntry = findComicInfoEntry(archive)

  const opfResult = opfEntry ? await loadOpf(opfEntry, events) : undefined
  const comicInfoResult = comicInfoEntry
    ? await loadComicInfo(comicInfoEntry, events)
    : undefined

  const hasOpf = opfResult !== undefined
  const opfSource = opfResult?.source

  const readingOrder = await resolveArchiveReadingOrder(
    archive,
    opfSource ? { opf: opfSource } : undefined,
  )
  const cover = await resolveArchiveCover(
    archive,
    opfSource ? { opf: opfSource, readingOrder } : { readingOrder },
  )

  return {
    hasOpf,
    hasComicInfo: comicInfoResult !== undefined,
    opf: opfResult?.metadata,
    comicInfo: comicInfoResult,
    coverHref: cover?.uri,
    pageCount: resolvePageCount({ hasOpf, readingOrder }),
  }
}

const isImageReadingOrderItem = (item: ArchiveReadingOrderItem): boolean =>
  item.mediaType?.startsWith("image/") === true

/**
 * Decide which signal represents the "page count" for this archive.
 * EPUB reading-position counts are left to clients that need them; for
 * anything else (comics, loose image archives) we fall back to the
 * image-entry count, which is what comic readers use as a page number.
 */
const resolvePageCount = ({
  hasOpf,
  readingOrder,
}: {
  hasOpf: boolean
  readingOrder: ArchiveReadingOrderItem[]
}): number | undefined => {
  if (hasOpf) return undefined

  const imageEntryCount = readingOrder.filter(isImageReadingOrderItem).length

  return imageEntryCount > 0 ? imageEntryCount : undefined
}

const loadOpf = async (
  entry: ArchiveFileRecord,
  events: ReadArchiveMetadataEvents | undefined,
) => {
  const xml = await readRecordAsText(entry)

  events?.onOpfRead?.({ path: entry.uri, xml })

  const opf = parseOpf(xml)
  const lastSlash = entry.uri.lastIndexOf("/")
  const basePath = lastSlash === -1 ? "" : entry.uri.substring(0, lastSlash)

  return {
    metadata: resolveArchiveMetadata(opf),
    source: { opf, basePath },
  }
}

const loadComicInfo = async (
  entry: ArchiveFileRecord,
  events: ReadArchiveMetadataEvents | undefined,
) => {
  const xml = await readRecordAsText(entry)

  events?.onComicInfoRead?.({ path: entry.uri, xml })

  return resolveArchiveMetadata(parseComicInfo(xml))
}
