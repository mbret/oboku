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
  type XmlElement,
  parseXml,
  serializeXml,
  upsertChildElement,
} from "../utils/dom"

type ComicInfoMetadataPatch = {
  identifiers: ReadonlyArray<ArchiveMetadataIdentifier>
  removedIdentifiers?: ReadonlyArray<ArchiveMetadataIdentifier>
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

const childText = (root: XmlElement, tagName: string): string | undefined => {
  const text = root.getElementsByTagName(tagName)[0]?.textContent?.trim()

  return text !== undefined && text !== "" ? text : undefined
}

const webUrl = (identifier: ArchiveMetadataIdentifier): string | undefined =>
  normalizeIdentifierScheme(identifier.scheme) === URL_IDENTIFIER_SCHEME
    ? identifier.value
    : catalogUrlFromIdentifier(identifier)

/**
 * `<GTIN>` holds one value, so the patched ISBN takes it. With none to write,
 * the field only clears when a removal names what it currently holds —
 * otherwise it is left as the book had it.
 */
const gtinValue = (
  root: XmlElement,
  { identifiers, removedIdentifiers }: ComicInfoMetadataPatch,
): string | undefined => {
  const patched = identifiers.find(function isGtinBearing({ scheme }) {
    return isIsbnBearingScheme(scheme)
  })?.value

  if (patched !== undefined) return patched

  const existing = childText(root, "GTIN")

  return (removedIdentifiers ?? []).some(function names({ scheme, value }) {
    return isIsbnBearingScheme(scheme) && value.trim() === existing
  })
    ? undefined
    : existing
}

/**
 * `<Web>` is a space-separated list, and not every token in it is an identifier
 * this writer can read back — the reader reports the links and drops the rest.
 * So the field is edited rather than regenerated: what a removal names goes,
 * the patched links are added, and every other token stays where the book put
 * it.
 */
const webValue = (
  root: XmlElement,
  { identifiers, removedIdentifiers }: ComicInfoMetadataPatch,
): string | undefined => {
  const removedUrls = new Set(
    (removedIdentifiers ?? []).flatMap(function toRemovedUrl(identifier) {
      const url = webUrl(identifier)

      return url === undefined ? [] : [url]
    }),
  )
  const kept = (childText(root, "Web") ?? "")
    .split(/\s+/)
    .filter(function survives(token) {
      return token !== "" && !removedUrls.has(token)
    })
  const patched = identifiers.flatMap(function toPatchedUrl(identifier) {
    const url = webUrl(identifier)

    return url === undefined ? [] : [url]
  })
  const urls = [...new Set([...kept, ...patched])]

  return urls.length > 0 ? urls.join(" ") : undefined
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

  upsertChildElement(doc, root, "GTIN", gtinValue(root, patch))
  upsertChildElement(doc, root, "Web", webValue(root, patch))

  const serialized = serializeXml(doc)

  return serialized.startsWith("<?xml")
    ? serialized
    : `<?xml version="1.0" encoding="utf-8"?>\n${serialized}`
}
