import { readRecordAsText } from "@prose-reader/archive-reader"
import type { ArchiveFileRecord } from "../archive/types"
import {
  type XmlDocument,
  type XmlElement,
  parseXml,
  serializeXml,
} from "../utils/dom"

/**
 * Subset of OPF metadata fields the writer can update. Stays narrower
 * than the resolved OPF metadata on purpose: every entry here implies
 * a round-trip contract (read → mutate → re-read returns the same
 * value) we need to keep working across EPUB producers.
 *
 * Today only `isbn` is writable. Adding a new field means deciding
 * which OPF element it maps to *and* updating the ISBN-style
 * "find existing or create" logic for that element.
 */
export type OpfMetadataPatch = {
  isbn?: string | undefined
}

const OPF_LABEL = "OPF"

const DC_NAMESPACE = "http://purl.org/dc/elements/1.1/"

const OPF_NAMESPACE = "http://www.idpf.org/2007/opf"

const IDENTIFIER_ELEMENT_NAME = "dc:identifier"

const ISBN_SCHEME = "ISBN"

/** Every spelling of the scheme attribute the read side accepts. */
const SCHEME_ATTRIBUTES = ["opf:scheme", "opf:Scheme", "scheme"] as const

/**
 * Apply a metadata patch to an existing OPF package document and
 * return the serialized XML body the caller should write back. The
 * archive ownership stays with the caller — same layering choice as
 * {@link buildPatchedComicInfoXml}.
 *
 * Unlike ComicInfo, we do *not* synthesize an OPF when the archive
 * has none: that would turn a CBZ into an EPUB, which is well outside
 * the scope of "fix metadata in place". Callers should gate on the
 * archive actually carrying an OPF before requesting an OPF target.
 */
export const buildPatchedOpfXml = async (
  entry: ArchiveFileRecord,
  patch: OpfMetadataPatch,
): Promise<string> => {
  const xml = await readRecordAsText(entry)

  return serializeOpfXml(xml, patch)
}

const serializeOpfXml = (xml: string, patch: OpfMetadataPatch): string => {
  const doc = parseXml(xml, OPF_LABEL)
  const root = doc.documentElement

  if (!root || localName(root.tagName) !== "package") {
    throw new Error("OPF root element is not <package>")
  }

  const metadata = findChildByLocalName(root, "metadata")

  if (!metadata) {
    throw new Error("OPF document has no <metadata> element")
  }

  upsertIsbnIdentifier(doc, root, metadata, patch.isbn)

  const serialized = serializeXml(doc)

  return serialized.startsWith("<?xml")
    ? serialized
    : `<?xml version="1.0" encoding="utf-8"?>\n${serialized}`
}

/**
 * Elements are matched by local name, the same way the read side does, so a
 * document that prefixes the OPF namespace — or leaves `<identifier>`
 * unprefixed under a default one — stays one this writer can update rather
 * than reject or duplicate into.
 */
const localName = (tagName: string): string =>
  tagName.slice(tagName.lastIndexOf(":") + 1).toLowerCase()

const listChildrenByLocalName = (
  parent: XmlElement,
  name: string,
): XmlElement[] =>
  Array.from(parent.children).filter(function matchesLocalName(child) {
    return localName(child.tagName) === name
  })

const findChildByLocalName = (
  parent: XmlElement,
  name: string,
): XmlElement | undefined => listChildrenByLocalName(parent, name)[0]

/**
 * ONIX codelist 5 codes the read side maps to a scheme name, so an identifier
 * typed `<meta property="identifier-type" scheme="onix:codelist5">15</meta>`
 * is matched as the ISBN the reader reports rather than as the literal `15`.
 */
const ONIX_IDENTIFIER_TYPES: Record<string, string> = {
  "02": "ISBN",
  "03": "GTIN",
  "04": "UPC",
  "05": "ISMN",
  "06": "DOI",
  "13": "LCCN",
  "14": "GTIN",
  "15": "ISBN",
  "22": "URN",
  "23": "OCLC",
  "24": "ISBN",
  "25": "ISMN",
  "26": "DOI",
  "34": "GTIN",
  "35": "ARK",
}

const refiningMetas = (metadata: XmlElement, id: string): XmlElement[] =>
  id === ""
    ? []
    : listChildrenByLocalName(metadata, "meta").filter(
        function refinesElement(meta) {
          return meta.getAttribute("refines")?.trim() === `#${id}`
        },
      )

const identifierTypeMeta = (
  metadata: XmlElement,
  element: XmlElement,
): XmlElement | undefined =>
  refiningMetas(metadata, element.getAttribute("id")?.trim() ?? "").find(
    function statesIdentifierType(meta) {
      return meta.getAttribute("property")?.trim() === "identifier-type"
    },
  )

const metaIdentifierType = (meta: XmlElement): string => {
  const value = meta.textContent?.trim() ?? ""
  const isOnixCode =
    meta.getAttribute("scheme")?.trim().toLowerCase() === "onix:codelist5"

  return isOnixCode ? (ONIX_IDENTIFIER_TYPES[value] ?? value) : value
}

const attributeScheme = (element: XmlElement): string | undefined => {
  for (const name of SCHEME_ATTRIBUTES) {
    const value = element.getAttribute(name)?.trim()

    if (value !== undefined && value !== "") return value
  }

  return undefined
}

/**
 * The scheme an element states, wherever it states it: EPUB 2 puts it on the
 * identifier, EPUB 3 refines it from a sibling `<meta>`.
 */
const elementScheme = (metadata: XmlElement, element: XmlElement): string => {
  const attribute = attributeScheme(element)

  if (attribute !== undefined) return attribute

  const meta = identifierTypeMeta(metadata, element)

  return meta === undefined ? "" : metaIdentifierType(meta)
}

/**
 * Locate the `<dc:identifier>` the read side reports as the ISBN, if any —
 * matching where it states its scheme and how it spells it, so writes target
 * the node reads pick up instead of appending a second one beside it.
 */
const findIsbnIdentifier = (metadata: XmlElement): XmlElement | undefined =>
  listChildrenByLocalName(metadata, "identifier").find(
    function carriesIsbnScheme(element) {
      return elementScheme(metadata, element).toLowerCase() === "isbn"
    },
  )

/**
 * The package's `unique-identifier` names a `dc:identifier` by id. Removing
 * that element would leave the reference dangling and the document invalid,
 * so it is the one identifier this writer will not delete.
 */
const isUniqueIdentifierElement = (
  root: XmlElement,
  element: XmlElement,
): boolean => {
  const uniqueIdentifierId = root.getAttribute("unique-identifier")?.trim()

  return (
    uniqueIdentifierId !== undefined &&
    uniqueIdentifierId !== "" &&
    element.getAttribute("id")?.trim() === uniqueIdentifierId
  )
}

/**
 * Removes an identifier along with the metadata refining it, which would
 * otherwise be left pointing at an id the package no longer has.
 */
const removeIdentifier = (metadata: XmlElement, element: XmlElement): void => {
  for (const meta of refiningMetas(
    metadata,
    element.getAttribute("id")?.trim() ?? "",
  )) {
    metadata.removeChild(meta)
  }

  metadata.removeChild(element)
}

// Untagged `<dc:identifier>` elements may be the publication UUID
// referenced by `<package unique-identifier>`; only ISBN-tagged
// identifiers are touched.
const upsertIsbnIdentifier = (
  doc: XmlDocument,
  root: XmlElement,
  metadata: XmlElement,
  isbn: string | undefined,
): void => {
  const existing = findIsbnIdentifier(metadata)

  if (isbn === undefined || isbn === "") {
    if (existing && !isUniqueIdentifierElement(root, existing)) {
      removeIdentifier(metadata, existing)
    }

    return
  }

  if (existing) {
    existing.textContent = isbn

    return
  }

  /**
   * Created and tagged through the namespace rather than by prefixed name: a
   * package that uses the OPF namespace by default need not declare the legacy
   * `opf` prefix, and an unbound one serializes into a document that no longer
   * parses.
   */
  const next = doc.createElementNS(DC_NAMESPACE, IDENTIFIER_ELEMENT_NAME)
  next.setAttributeNS(OPF_NAMESPACE, "opf:scheme", ISBN_SCHEME)
  next.textContent = isbn
  metadata.appendChild(next)
}
