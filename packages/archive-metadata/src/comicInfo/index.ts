import { COMIC_INFO_FILENAME as PROSE_COMIC_INFO_FILENAME } from "@prose-reader/archive-parser"
import {
  type ArchiveEntry,
  type ArchiveSource,
  findEntry,
} from "../archive/types"
import {
  type XmlDocument,
  parseXml,
  serializeXml,
  upsertChildElement,
} from "../utils/dom"

type ComicInfoMetadataPatch = {
  isbn?: string | undefined
}

export { PROSE_COMIC_INFO_FILENAME as COMIC_INFO_FILENAME }

const COMIC_INFO_LABEL = "ComicInfo.xml"

const COMIC_INFO_NAMESPACE_ATTRS = {
  xmlns_xsi: "http://www.w3.org/2001/XMLSchema-instance",
  xmlns_xsd: "http://www.w3.org/2001/XMLSchema",
}

/**
 * Locate a `ComicInfo.xml` entry regardless of casing. Matches only the
 * top-level filename — nested `comicinfo.xml` files inside sub-folders
 * are not part of the spec and silently ignored. Internal to the
 * package; the unified reader and writer consume it.
 */
export const findComicInfoEntry = (
  source: ArchiveSource,
): Promise<ArchiveEntry | undefined> =>
  findEntry(
    source,
    (entry) =>
      entry.path.toLowerCase() === PROSE_COMIC_INFO_FILENAME.toLowerCase(),
  )

/**
 * Produce the new ComicInfo.xml body for a patched archive. Handles
 * the "archive has no ComicInfo yet" case by synthesizing a minimal
 * document, and the "archive has a malformed ComicInfo" case by
 * synthesizing a fresh document too — the inspection step is the one
 * responsible for warning the user that an unreadable ComicInfo.xml
 * will be overwritten.
 *
 * Internal to the package; the public surface is `patchArchiveMetadata`,
 * which dispatches to this based on archive shape.
 */
export const buildPatchedComicInfoXml = async (
  source: ArchiveSource,
  patch: ComicInfoMetadataPatch,
): Promise<string> => {
  const entry = await findComicInfoEntry(source)
  const existingXml = entry ? await entry.readAsString() : null

  return serializeComicInfoXml(existingXml, patch)
}

const createFreshComicInfoDocument = (): XmlDocument =>
  parseXml(
    `<?xml version="1.0" encoding="utf-8"?><ComicInfo xmlns:xsi="${COMIC_INFO_NAMESPACE_ATTRS.xmlns_xsi}" xmlns:xsd="${COMIC_INFO_NAMESPACE_ATTRS.xmlns_xsd}"></ComicInfo>`,
    COMIC_INFO_LABEL,
  )

const tryParseExistingComicInfo = (xml: string): XmlDocument | undefined => {
  try {
    return parseXml(xml, COMIC_INFO_LABEL)
  } catch {
    return undefined
  }
}

const serializeComicInfoXml = (
  existingXml: string | undefined | null,
  patch: ComicInfoMetadataPatch,
): string => {
  const parsedExisting = existingXml
    ? tryParseExistingComicInfo(existingXml)
    : undefined
  const doc = parsedExisting ?? createFreshComicInfoDocument()

  const root = doc.documentElement

  if (root?.tagName !== "ComicInfo") {
    throw new Error("ComicInfo.xml root element is not <ComicInfo>")
  }

  upsertChildElement(doc, root, "GTIN", patch.isbn)

  const serialized = serializeXml(doc)

  return serialized.startsWith("<?xml")
    ? serialized
    : `<?xml version="1.0" encoding="utf-8"?>\n${serialized}`
}
