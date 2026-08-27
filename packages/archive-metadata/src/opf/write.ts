import {
  normalizeIdentifierScheme,
  OPF_IDENTIFIER_SCHEME_ATTRIBUTES,
  OPF_IDENTIFIER_SCHEME_LOCAL_NAMES,
  OPF_NAMESPACE,
  opfIdentifierTypeScheme,
  readRecordAsText,
} from "@prose-reader/archive-reader"
import type { ArchiveFileRecord } from "../archive/types"
import type { ArchiveMetadataIdentifier } from "../metadata/write"
import { isUntaggedIdentifierScheme } from "../metadata/identifiers"
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
 * Today only `identifiers` is writable. Adding a new field means
 * deciding which OPF element it maps to *and* giving it the same
 * "find existing or create" reconciliation identifiers get.
 */
export type OpfMetadataPatch = {
  identifiers: ReadonlyArray<ArchiveMetadataIdentifier>
}

const OPF_LABEL = "OPF"

const DC_NAMESPACE = "http://purl.org/dc/elements/1.1/"

const IDENTIFIER_ELEMENT_NAME = "dc:identifier"

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

  reconcileIdentifiers(doc, root, metadata, patch.identifiers)

  const serialized = serializeXml(doc)

  return serialized.startsWith("<?xml")
    ? serialized
    : `<?xml version="1.0" encoding="utf-8"?>\n${serialized}`
}

/**
 * Elements are matched by local name, the same way the read side does, so a
 * document that prefixes the OPF namespace — or leaves `<identifier>`
 * unprefixed under a default one — stays one this writer can reconcile rather
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
 * Where an element's scheme is stated. EPUB 2 puts it on the identifier, EPUB 3
 * refines it from a sibling `<meta>` — a rewrite keeps whichever the document
 * chose, so the two never end up contradicting each other.
 */
type SchemeSink =
  | { readonly kind: "namespaced"; readonly localName: string }
  | { readonly kind: "attribute"; readonly name: string }
  | { readonly kind: "refinement"; readonly meta: XmlElement }

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

const metaIdentifierType = (meta: XmlElement): string =>
  opfIdentifierTypeScheme({
    value: meta.textContent ?? "",
    scheme: meta.getAttribute("scheme") ?? "",
  }) ?? ""

/**
 * Where an element already states its scheme, preferring the namespace over the
 * spelling: a package may bind the OPF namespace to any prefix, and a rewrite
 * has to land on the attribute the reader read rather than beside it.
 *
 * The literal `opf:`-prefixed names are still tried, for a package that uses
 * the prefix without declaring it — invalid, but the read side tolerates it, so
 * the write side has to find the same attribute.
 */
const schemeSink = (
  metadata: XmlElement,
  element: XmlElement,
): SchemeSink | undefined => {
  const localName = OPF_IDENTIFIER_SCHEME_LOCAL_NAMES.find(
    function isCarriedInNamespace(name) {
      return (element.getAttributeNS(OPF_NAMESPACE, name)?.trim() ?? "") !== ""
    },
  )

  if (localName !== undefined) return { kind: "namespaced", localName }

  const attribute = OPF_IDENTIFIER_SCHEME_ATTRIBUTES.find(
    function isCarriedLiterally(name) {
      return (element.getAttribute(name)?.trim() ?? "") !== ""
    },
  )

  if (attribute !== undefined) return { kind: "attribute", name: attribute }

  const meta = identifierTypeMeta(metadata, element)

  return meta === undefined ? undefined : { kind: "refinement", meta }
}

const elementScheme = (metadata: XmlElement, element: XmlElement): string => {
  const sink = schemeSink(metadata, element)

  switch (sink?.kind) {
    case undefined:
      return ""
    case "namespaced":
      return element.getAttributeNS(OPF_NAMESPACE, sink.localName)?.trim() ?? ""
    case "attribute":
      return element.getAttribute(sink.name)?.trim() ?? ""
    case "refinement":
      return metaIdentifierType(sink.meta)
  }
}

const schemeKey = (scheme: string): string =>
  isUntaggedIdentifierScheme(scheme) ? "" : scheme.trim().toLowerCase()

const clearScheme = (metadata: XmlElement, element: XmlElement): void => {
  for (const localName of OPF_IDENTIFIER_SCHEME_LOCAL_NAMES) {
    element.removeAttributeNS(OPF_NAMESPACE, localName)
    element.removeAttribute(localName)
  }

  for (const attribute of OPF_IDENTIFIER_SCHEME_ATTRIBUTES) {
    element.removeAttribute(attribute)
  }

  const meta = identifierTypeMeta(metadata, element)

  if (meta) metadata.removeChild(meta)
}

const writeIdentifier = (
  metadata: XmlElement,
  element: XmlElement,
  { scheme, value }: ArchiveMetadataIdentifier,
): void => {
  element.textContent = value

  if (isUntaggedIdentifierScheme(scheme)) {
    clearScheme(metadata, element)

    return
  }

  const normalized = normalizeIdentifierScheme(scheme)
  const sink = schemeSink(metadata, element)

  switch (sink?.kind) {
    case "refinement":
      sink.meta.textContent = normalized
      sink.meta.removeAttribute("scheme")

      return
    /**
     * Addressed by namespace and local name, which rewrites the value of the
     * attribute already there and leaves whichever prefix the package chose
     * for it alone.
     */
    case "namespaced":
      element.setAttributeNS(OPF_NAMESPACE, sink.localName, normalized)

      return
    case "attribute":
      element.setAttribute(sink.name, normalized)

      return
    /**
     * Bound rather than set as a plain `opf:scheme` name: a package that uses
     * the OPF namespace by default need not declare the legacy prefix, and an
     * unbound one serializes into a document that no longer parses.
     */
    case undefined:
      element.setAttributeNS(OPF_NAMESPACE, "opf:scheme", normalized)

      return
  }
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

const groupBySchemeKey = (
  metadata: XmlElement,
  elements: ReadonlyArray<XmlElement>,
): Map<string, XmlElement[]> => {
  const groups = new Map<string, XmlElement[]>()

  for (const element of elements) {
    const key = schemeKey(elementScheme(metadata, element))
    const group = groups.get(key)

    if (group) group.push(element)
    else groups.set(key, [element])
  }

  return groups
}

const findUniqueIdentifierElement = (
  root: XmlElement,
  elements: ReadonlyArray<XmlElement>,
): XmlElement | undefined => {
  const uniqueIdentifierId = root.getAttribute("unique-identifier")?.trim()

  if (uniqueIdentifierId === undefined || uniqueIdentifierId === "") {
    return undefined
  }

  return elements.find(function carriesUniqueIdentifierId(element) {
    return element.getAttribute("id")?.trim() === uniqueIdentifierId
  })
}

/**
 * Rewrites the document's identifiers so it ends up carrying exactly the
 * patched set, reusing the existing element of a scheme rather than replacing
 * it — an element may be the target of `<meta refines>` entries, and its `id`
 * has to survive an edit for those to keep resolving.
 */
const reconcileIdentifiers = (
  doc: XmlDocument,
  root: XmlElement,
  metadata: XmlElement,
  identifiers: ReadonlyArray<ArchiveMetadataIdentifier>,
): void => {
  const elements = listChildrenByLocalName(metadata, "identifier")
  const uniqueElement = findUniqueIdentifierElement(root, elements)
  const uniqueIdentifier = identifiers.find(function isPinnedToUniqueElement({
    unique,
  }) {
    return unique === true
  })

  if (uniqueElement && uniqueIdentifier) {
    writeIdentifier(metadata, uniqueElement, uniqueIdentifier)
  }

  const reusable = groupBySchemeKey(
    metadata,
    elements.filter(function isReconcilable(element) {
      return element !== uniqueElement
    }),
  )

  for (const identifier of identifiers) {
    if (identifier === uniqueIdentifier && uniqueElement) continue

    const element =
      reusable.get(schemeKey(identifier.scheme))?.shift() ??
      metadata.appendChild(
        doc.createElementNS(DC_NAMESPACE, IDENTIFIER_ELEMENT_NAME),
      )

    writeIdentifier(metadata, element, identifier)
  }

  for (const leftovers of reusable.values()) {
    for (const element of leftovers) removeIdentifier(metadata, element)
  }
}
