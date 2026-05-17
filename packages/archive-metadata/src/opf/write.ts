import type { ArchiveEntry } from "../archive/types"
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

/**
 * Apply a metadata patch to an existing OPF package document and
 * return the serialized XML body the caller should write back. The
 * archive ownership stays with the caller — same layering choice as
 * {@link buildPatchedComicInfoXml}.
 *
 * Unlike ComicInfo, we do *not* synthesize an OPF when the archive
 * has none: that would turn a CBZ into an EPUB, which is well outside
 * the scope of "fix metadata in place". Callers should gate on
 * {@link ArchiveMetadata.hasOpf} before requesting an OPF target.
 */
export const buildPatchedOpfXml = async (
  entry: ArchiveEntry,
  patch: OpfMetadataPatch,
): Promise<string> => {
  const xml = await entry.readAsString()

  return serializeOpfXml(xml, patch)
}

const serializeOpfXml = (xml: string, patch: OpfMetadataPatch): string => {
  const doc = parseXml(xml, OPF_LABEL)
  const root = doc.documentElement

  if (!root || root.tagName !== "package") {
    throw new Error("OPF root element is not <package>")
  }

  const metadata = root.getElementsByTagName("metadata").item(0)

  if (!metadata) {
    throw new Error("OPF document has no <metadata> element")
  }

  upsertIsbnIdentifier(doc, metadata, patch.isbn)

  const serialized = serializeXml(doc)

  return serialized.startsWith("<?xml")
    ? serialized
    : `<?xml version="1.0" encoding="utf-8"?>\n${serialized}`
}

/**
 * Locate the `<dc:identifier>` carrying an ISBN scheme, if any. Both
 * `opf:scheme="ISBN"` and the bare `scheme="ISBN"` form are accepted,
 * with case-insensitive comparison — same rules the read side uses
 * when extracting the value, so writes target the same node reads
 * pick up.
 */
const findIsbnIdentifier = (parent: XmlElement): XmlElement | undefined => {
  const identifiers = parent.getElementsByTagName("dc:identifier")

  for (let i = 0; i < identifiers.length; i += 1) {
    const node = identifiers.item(i)

    if (!node) continue

    const scheme = (
      node.getAttribute("opf:scheme") ??
      node.getAttribute("scheme") ??
      ""
    ).toLowerCase()

    if (scheme === "isbn") return node
  }

  return undefined
}

// Untagged `<dc:identifier>` elements may be the publication UUID
// referenced by `<package unique-identifier>`; only ISBN-tagged
// identifiers are touched.
const upsertIsbnIdentifier = (
  doc: XmlDocument,
  metadata: XmlElement,
  isbn: string | undefined,
): void => {
  const existing = findIsbnIdentifier(metadata)

  if (isbn === undefined || isbn === "") {
    if (existing) metadata.removeChild(existing)

    return
  }

  if (existing) {
    existing.textContent = isbn
    return
  }

  const next = doc.createElement("dc:identifier")
  next.setAttribute("opf:scheme", "ISBN")
  next.textContent = isbn
  metadata.appendChild(next)
}
