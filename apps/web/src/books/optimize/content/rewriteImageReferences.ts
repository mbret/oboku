import { type EditableArchive, readEntryText } from "../editableArchive"
import {
  getExtension,
  IMAGE_EXTENSIONS,
  replaceExtensionWithWebp,
} from "./images"

const TEXT_REFERENCE_EXTENSIONS: ReadonlySet<string> = new Set([
  ".xhtml",
  ".html",
  ".htm",
  ".xml",
  ".ncx",
  ".css",
  ".svg",
])

const OPF_EXTENSION = ".opf"
const WEBP_MEDIA_TYPE = "image/webp"

const getDirname = (path: string): string => {
  const lastSlash = path.lastIndexOf("/")

  return lastSlash === -1 ? "" : path.substring(0, lastSlash)
}

const decodeSegment = (segment: string): string => {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/**
 * Document references may be percent-encoded (e.g. `images/page%201.jpg`) while
 * archive entry names — and therefore `renamedPaths` — are stored unescaped. We
 * decode per segment so the resolved path can match the archive entry without
 * turning an encoded slash (`%2F`) into a path separator.
 */
const resolveArchivePath = (baseDir: string, reference: string): string => {
  const decodedReference = reference.split("/").map(decodeSegment).join("/")
  const combined =
    decodedReference.startsWith("/") || baseDir === ""
      ? decodedReference
      : `${baseDir}/${decodedReference}`
  const stack: string[] = []

  for (const segment of combined.split("/")) {
    if (segment === "" || segment === ".") continue
    if (segment === "..") {
      stack.pop()
      continue
    }
    stack.push(segment)
  }

  return stack.join("/")
}

const EXTENSION_ALTERNATION = [...IMAGE_EXTENSIONS]
  .map((extension) => extension.slice(1))
  .join("|")

/**
 * Two ways an image path can appear in a document:
 *  1. delimited by a quote or `url(` on both sides (`src="…"`, `url(…)`), which
 *     lets the path legally contain spaces — `src="images/page 1.jpg"`;
 *  2. bare, bounded by whitespace/punctuation, where a space terminates it.
 *
 * The delimited branch is tried first so a quoted path keeps its spaces instead
 * of being truncated to the trailing segment by the bare branch.
 */
const IMAGE_REFERENCE_PATTERN = new RegExp(
  `(?<=["'(])([^"'()<>?#]*\\.(?:${EXTENSION_ALTERNATION}))((?:[?#][^"'()<>]*)?)(?=["')])` +
    "|" +
    `(?<![^\\s"'()<>=,])([^\\s"'()<>?#,]*\\.(?:${EXTENSION_ALTERNATION})(?![\\w]))((?:[?#][^\\s"'()<>,]*)?)`,
  "gi",
)

const rewriteTextReferences = (
  content: string,
  baseDir: string,
  renamedPaths: ReadonlySet<string>,
): string =>
  content.replace(
    IMAGE_REFERENCE_PATTERN,
    (
      match: string,
      delimitedReference: string | undefined,
      delimitedSuffix: string | undefined,
      bareReference: string | undefined,
      bareSuffix: string | undefined,
    ) => {
      const reference = delimitedReference ?? bareReference
      const suffix = delimitedSuffix ?? bareSuffix ?? ""

      if (reference === undefined) return match
      if (!renamedPaths.has(resolveArchivePath(baseDir, reference)))
        return match

      return `${replaceExtensionWithWebp(reference)}${suffix}`
    },
  )

const rewriteOpfManifest = (
  xml: string,
  baseDir: string,
  renamedPaths: ReadonlySet<string>,
): string | undefined => {
  const doc = new DOMParser().parseFromString(xml, "application/xml")

  if (doc.getElementsByTagName("parsererror").length > 0) return undefined

  const items = doc.getElementsByTagNameNS("*", "item")
  let changed = false

  for (const item of Array.from(items)) {
    const href = item.getAttribute("href")
    if (!href) continue

    if (!renamedPaths.has(resolveArchivePath(baseDir, href))) continue

    item.setAttribute("href", replaceExtensionWithWebp(href))
    item.setAttribute("media-type", WEBP_MEDIA_TYPE)
    changed = true
  }

  if (!changed) return undefined

  return new XMLSerializer().serializeToString(doc)
}

/**
 * Rewrites references to images that were converted to WebP across the
 * archive's text documents and OPF manifest.
 *
 * References are resolved relative to the document that contains them and
 * matched against the full archive paths in `renamedPaths`, so an image that
 * shares a basename with a skipped image in another folder is left untouched.
 */
export const rewriteImageReferences = async (
  entries: EditableArchive,
  renamedPaths: ReadonlySet<string>,
): Promise<void> => {
  if (renamedPaths.size === 0) return

  for (const [path, entry] of entries) {
    if (entry.dir) continue

    const extension = getExtension(path)
    const isOpf = extension === OPF_EXTENSION

    if (!isOpf && !TEXT_REFERENCE_EXTENSIONS.has(extension)) continue

    const content = await readEntryText(entry.content)
    const baseDir = getDirname(path)

    if (isOpf) {
      const manifestRewritten = rewriteOpfManifest(
        content,
        baseDir,
        renamedPaths,
      )
      const next = rewriteTextReferences(
        manifestRewritten ?? content,
        baseDir,
        renamedPaths,
      )

      if (next !== content) entries.set(path, { dir: false, content: next })

      continue
    }

    const next = rewriteTextReferences(content, baseDir, renamedPaths)

    if (next !== content) entries.set(path, { dir: false, content: next })
  }
}
