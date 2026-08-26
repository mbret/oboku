import {
  parseOpf,
  readRecordAsText,
  resolveArchiveMetadata,
  type OpfIdentifier,
  type ResolvedMetadataIdentifier,
} from "@prose-reader/archive-reader"
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

/**
 * Which identifier the writer should touch is the reader's decision, not one
 * this writer re-derives: `parseOpf` reports each element verbatim — including
 * the `id` that addresses it — and `resolveArchiveMetadata` says what scheme
 * the book ends up advertising for it, across every spelling of the scheme
 * attribute and the EPUB 3 `identifier-type` refinements. Reading the document
 * any other way is how a writer ends up editing an element the reader does not
 * report, or appending a second one beside it.
 *
 * The two lists are index-aligned: the resolver maps over the parsed
 * identifiers one to one.
 */
type ReaderIdentifier = {
  readonly parsed: OpfIdentifier
  readonly resolved: ResolvedMetadataIdentifier
}

const readerIdentifiers = (xml: string): ReadonlyArray<ReaderIdentifier> => {
  const parsed = parseOpf(xml)
  const resolved = resolveArchiveMetadata(parsed).identifiers ?? []

  return parsed.identifiers.flatMap(function pairWithResolved(entry, index) {
    const counterpart = resolved[index]

    return counterpart === undefined
      ? []
      : [{ parsed: entry, resolved: counterpart }]
  })
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

  upsertIsbnIdentifier(doc, metadata, readerIdentifiers(xml), patch.isbn)

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
 * An element's own text, excluding any nested element's — the value the parser
 * reads. `textContent` would fold descendants in, and disagreeing with the
 * parser about which elements have a value is what shifts the positions below.
 */
const directText = (element: XmlElement): string =>
  Array.from(element.childNodes)
    .filter(function isTextual(node) {
      return (
        node.nodeType === Node.TEXT_NODE ||
        node.nodeType === Node.CDATA_SECTION_NODE
      )
    })
    .map(function nodeText(node) {
      return node.nodeValue ?? ""
    })
    .join("")

/**
 * The identifier elements the parser reports, in its order. Valueless elements
 * are skipped because the parser drops them, and one authored empty — or
 * holding only a nested element — would otherwise shift every position after
 * it.
 */
const identifierElements = (metadata: XmlElement): XmlElement[] =>
  listChildrenByLocalName(metadata, "identifier").filter(
    function statesAValue(element) {
      return directText(element).trim() !== ""
    },
  )

/**
 * The element the reader read an identifier from. An `id` addresses it exactly;
 * an identifier authored without one has only its position among the identifier
 * elements, which is the order the parser reported it in.
 */
const findIdentifierElement = (
  metadata: XmlElement,
  { parsed }: ReaderIdentifier,
  index: number,
): XmlElement | undefined => {
  const elements = identifierElements(metadata)

  if (parsed.id === undefined) return elements[index]

  return (
    elements.find(function carriesId(element) {
      return element.getAttribute("id")?.trim() === parsed.id
    }) ?? elements[index]
  )
}

const isbnIdentifierIndex = (
  identifiers: ReadonlyArray<ReaderIdentifier>,
): number =>
  identifiers.findIndex(function resolvesAsIsbn({ resolved }) {
    return resolved.scheme === ISBN_SCHEME
  })

/**
 * Removes an identifier along with the metadata refining it, which would
 * otherwise be left pointing at an id the package no longer has.
 */
const removeIdentifier = (
  metadata: XmlElement,
  element: XmlElement,
  refinedBy: ReadonlyArray<string>,
): void => {
  for (const meta of listChildrenByLocalName(metadata, "meta")) {
    if (refinedBy.includes(meta.getAttribute("refines")?.trim() ?? "")) {
      metadata.removeChild(meta)
    }
  }

  metadata.removeChild(element)
}

const refinementTargets = ({ parsed }: ReaderIdentifier): string[] =>
  parsed.id === undefined ? [] : [`#${parsed.id}`, parsed.id]

// Untagged `<dc:identifier>` elements may be the publication UUID
// referenced by `<package unique-identifier>`; only ISBN-tagged
// identifiers are touched.
const upsertIsbnIdentifier = (
  doc: XmlDocument,
  metadata: XmlElement,
  identifiers: ReadonlyArray<ReaderIdentifier>,
  isbn: string | undefined,
): void => {
  const index = isbnIdentifierIndex(identifiers)
  const existing = identifiers[index]
  const element =
    existing === undefined
      ? undefined
      : findIdentifierElement(metadata, existing, index)

  if (isbn === undefined || isbn === "") {
    /**
     * The element `<package unique-identifier>` names is structural: removing
     * it leaves the reference dangling. Untagging it would buy nothing either,
     * since the reader infers ISBN from a bare ISBN value.
     */
    if (existing && element && existing.resolved.unique !== true) {
      removeIdentifier(metadata, element, refinementTargets(existing))
    }

    return
  }

  if (element) {
    element.textContent = isbn

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
