import { type EditableArchive, readEntryText } from "../update/editableArchive"
import {
  getExtension,
  IMAGE_EXTENSIONS,
  replaceExtensionWithWebp,
} from "./paths"

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

const MARKUP_ATTRIBUTE_PATTERN =
  /([^\s"'<>/=]+)(\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/g
const CSS_TOKEN_PATTERN =
  /\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|(\burl\(\s*)(?:"([^"]*)"|'([^']*)'|([^)"']*?))(\s*\))/gi
const SRCSET_CANDIDATE_PATTERN = /(^|[\s,])([^\s,]+)/g
const MARKUP_TOKEN_PATTERN =
  /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<script\b[\s\S]*?<\/script\s*>|(<style\b(?:"[^"]*"|'[^']*'|[^'">])*>)([\s\S]*?)(<\/style\s*>)|<(?:"[^"]*"|'[^']*'|[^'">])*>/gi

const REFERENCE_ATTRIBUTE_NAMES: ReadonlySet<string> = new Set([
  "background",
  "data",
  "data-src",
  "href",
  "poster",
  "src",
  "xlink:href",
])
const SRCSET_ATTRIBUTE_NAMES: ReadonlySet<string> = new Set([
  "data-srcset",
  "imagesrcset",
  "srcset",
])

const splitReferenceSuffix = (
  reference: string,
): { path: string; suffix: string } => {
  const suffixIndex = reference.search(/[?#]/)

  return suffixIndex === -1
    ? { path: reference, suffix: "" }
    : {
        path: reference.slice(0, suffixIndex),
        suffix: reference.slice(suffixIndex),
      }
}

const rewriteReference = (
  reference: string,
  baseDir: string,
  renamedPaths: ReadonlySet<string>,
): string => {
  const { path, suffix } = splitReferenceSuffix(reference)

  if (!IMAGE_EXTENSIONS.has(getExtension(path))) return reference
  if (!renamedPaths.has(resolveArchivePath(baseDir, path))) return reference

  return `${replaceExtensionWithWebp(path)}${suffix}`
}

const rewriteSrcsetReferences = (
  value: string,
  baseDir: string,
  renamedPaths: ReadonlySet<string>,
): string =>
  value.replace(
    SRCSET_CANDIDATE_PATTERN,
    function rewriteSrcsetCandidate(
      _match,
      separator: string,
      candidate: string,
    ) {
      return `${separator}${rewriteReference(candidate, baseDir, renamedPaths)}`
    },
  )

const rewriteCssReferences = (
  content: string,
  baseDir: string,
  renamedPaths: ReadonlySet<string>,
): string =>
  content.replace(
    CSS_TOKEN_PATTERN,
    function rewriteCssToken(
      match,
      urlPrefix: string | undefined,
      doubleQuotedValue: string | undefined,
      singleQuotedValue: string | undefined,
      unquotedValue: string | undefined,
      urlSuffix: string | undefined,
    ) {
      if (urlPrefix === undefined || urlSuffix === undefined) return match

      const value = doubleQuotedValue ?? singleQuotedValue ?? unquotedValue
      if (value === undefined) return match

      const rewritten = rewriteReference(value, baseDir, renamedPaths)

      if (doubleQuotedValue !== undefined)
        return `${urlPrefix}"${rewritten}"${urlSuffix}`
      if (singleQuotedValue !== undefined)
        return `${urlPrefix}'${rewritten}'${urlSuffix}`

      return `${urlPrefix}${rewritten}${urlSuffix}`
    },
  )

const rewriteMarkupAttributeValue = (
  attributeName: string,
  value: string,
  baseDir: string,
  renamedPaths: ReadonlySet<string>,
): string => {
  if (SRCSET_ATTRIBUTE_NAMES.has(attributeName)) {
    return rewriteSrcsetReferences(value, baseDir, renamedPaths)
  }

  if (REFERENCE_ATTRIBUTE_NAMES.has(attributeName)) {
    return rewriteReference(value, baseDir, renamedPaths)
  }

  return attributeName === "style"
    ? rewriteCssReferences(value, baseDir, renamedPaths)
    : value
}

const rewriteMarkupTagReferences = (
  tag: string,
  baseDir: string,
  renamedPaths: ReadonlySet<string>,
): string => {
  return tag.replace(
    MARKUP_ATTRIBUTE_PATTERN,
    function rewriteMarkupAttribute(
      match,
      attributeName: string,
      assignment: string,
      doubleQuotedValue: string | undefined,
      singleQuotedValue: string | undefined,
      unquotedValue: string | undefined,
    ) {
      const value = doubleQuotedValue ?? singleQuotedValue ?? unquotedValue
      if (value === undefined) return match

      const normalizedAttributeName = attributeName.toLowerCase()
      const rewritten = rewriteMarkupAttributeValue(
        normalizedAttributeName,
        value,
        baseDir,
        renamedPaths,
      )

      if (rewritten === value) return match

      if (doubleQuotedValue !== undefined)
        return `${attributeName}${assignment}"${rewritten}"`
      if (singleQuotedValue !== undefined)
        return `${attributeName}${assignment}'${rewritten}'`

      return `${attributeName}${assignment}${rewritten}`
    },
  )
}

const rewriteMarkupReferences = (
  content: string,
  baseDir: string,
  renamedPaths: ReadonlySet<string>,
): string =>
  content.replace(
    MARKUP_TOKEN_PATTERN,
    function rewriteMarkupToken(
      token,
      styleStart: string | undefined,
      styleContent: string | undefined,
      styleEnd: string | undefined,
    ) {
      if (
        styleStart !== undefined &&
        styleContent !== undefined &&
        styleEnd !== undefined
      ) {
        return `${styleStart}${rewriteCssReferences(
          styleContent,
          baseDir,
          renamedPaths,
        )}${styleEnd}`
      }

      if (/^<!--|^<!\[CDATA\[|^<script\b/i.test(token)) return token

      return rewriteMarkupTagReferences(token, baseDir, renamedPaths)
    },
  )

const rewriteTextReferences = (
  content: string,
  extension: string,
  baseDir: string,
  renamedPaths: ReadonlySet<string>,
): string =>
  extension === ".css"
    ? rewriteCssReferences(content, baseDir, renamedPaths)
    : rewriteMarkupReferences(content, baseDir, renamedPaths)

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

    const rewrittenHref = rewriteReference(href, baseDir, renamedPaths)

    if (rewrittenHref === href) continue

    item.setAttribute("href", rewrittenHref)
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
        extension,
        baseDir,
        renamedPaths,
      )

      if (next !== content) entries.set(path, { dir: false, content: next })

      continue
    }

    const next = rewriteTextReferences(
      content,
      extension,
      baseDir,
      renamedPaths,
    )

    if (next !== content) entries.set(path, { dir: false, content: next })
  }
}
