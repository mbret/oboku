import {
  catalogUrlFromIdentifier,
  COMIC_INFO_FILENAME as PROSE_COMIC_INFO_FILENAME,
  getArchiveHasComicInfo,
  isIsbnBearingScheme,
  isMetadataCatalogScheme,
  normalizeIdentifierScheme,
  readRecordAsText,
  type MetadataIdentifierScheme,
} from "@prose-reader/archive-reader"
import type { Archive } from "../archive/types"
import type { ArchiveMetadataIdentifier } from "../metadata/write"
import { URL_IDENTIFIER_SCHEME } from "../metadata/identifiers"
import {
  type XmlDocument,
  parseXml,
  serializeXml,
  upsertChildElement,
} from "../utils/dom"

type ComicInfoMetadataPatch = {
  identifiers: ReadonlyArray<ArchiveMetadataIdentifier>
}

export { PROSE_COMIC_INFO_FILENAME as COMIC_INFO_FILENAME }

const COMIC_INFO_LABEL = "ComicInfo.xml"

const COMIC_INFO_NAMESPACE_ATTRS = {
  xmlns_xsi: "http://www.w3.org/2001/XMLSchema-instance",
  xmlns_xsd: "http://www.w3.org/2001/XMLSchema",
}

/**
 * Schemes this writer can map onto a ComicInfo field: ISBN/GTIN-bearing ones
 * become `<GTIN>`, and `<Web>` takes both plain links and the catalogs that
 * have an official URL form. Consumers should check this before offering
 * ComicInfo as a target, since the writer silently has nothing to write for
 * the schemes it rejects.
 */
export const isComicInfoWritableIdentifierScheme = (
  scheme: MetadataIdentifierScheme,
): boolean =>
  isIsbnBearingScheme(scheme) ||
  normalizeIdentifierScheme(scheme) === URL_IDENTIFIER_SCHEME ||
  isMetadataCatalogScheme(scheme)

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
  archive: Archive,
  patch: ComicInfoMetadataPatch,
): Promise<string> => {
  const entry = getArchiveHasComicInfo(archive)
  const existingXml = entry ? await readRecordAsText(entry) : null

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

const gtinValue = (
  identifiers: ReadonlyArray<ArchiveMetadataIdentifier>,
): string | undefined =>
  identifiers.find(function isGtinBearing({ scheme }) {
    return isIsbnBearingScheme(scheme)
  })?.value

const webValue = (
  identifiers: ReadonlyArray<ArchiveMetadataIdentifier>,
): string | undefined => {
  const urls = identifiers.flatMap(function toWebUrl(identifier) {
    if (
      normalizeIdentifierScheme(identifier.scheme) === URL_IDENTIFIER_SCHEME
    ) {
      return [identifier.value]
    }

    const catalogUrl = catalogUrlFromIdentifier(identifier)

    return catalogUrl === undefined ? [] : [catalogUrl]
  })

  return urls.length > 0 ? urls.join(" ") : undefined
}

const serializeComicInfoXml = (
  existingXml: string | undefined | null,
  { identifiers }: ComicInfoMetadataPatch,
): string => {
  const parsedExisting = existingXml
    ? tryParseExistingComicInfo(existingXml)
    : undefined
  const doc = parsedExisting ?? createFreshComicInfoDocument()

  const root = doc.documentElement

  if (root?.tagName !== "ComicInfo") {
    throw new Error("ComicInfo.xml root element is not <ComicInfo>")
  }

  upsertChildElement(doc, root, "GTIN", gtinValue(identifiers))
  upsertChildElement(doc, root, "Web", webValue(identifiers))

  const serialized = serializeXml(doc)

  return serialized.startsWith("<?xml")
    ? serialized
    : `<?xml version="1.0" encoding="utf-8"?>\n${serialized}`
}
