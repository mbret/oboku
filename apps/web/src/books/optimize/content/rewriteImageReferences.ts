import type JSZip from "jszip"
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

const resolveArchivePath = (baseDir: string, reference: string): string => {
  const combined =
    reference.startsWith("/") || baseDir === ""
      ? reference
      : `${baseDir}/${reference}`
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

const IMAGE_REFERENCE_PATTERN = new RegExp(
  `(?<![^\\s"'()<>=,])([^\\s"'()<>?#,]*\\.(?:${[...IMAGE_EXTENSIONS]
    .map((extension) => extension.slice(1))
    .join("|")})(?![\\w]))((?:[?#][^\\s"'()<>,]*)?)`,
  "gi",
)

const rewriteTextReferences = (
  content: string,
  baseDir: string,
  renamedPaths: ReadonlySet<string>,
): string =>
  content.replace(
    IMAGE_REFERENCE_PATTERN,
    (match, reference: string, suffix: string) => {
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
  zip: JSZip,
  renamedPaths: ReadonlySet<string>,
): Promise<void> => {
  if (renamedPaths.size === 0) return

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue

    const extension = getExtension(entry.name)
    const isOpf = extension === OPF_EXTENSION

    if (!isOpf && !TEXT_REFERENCE_EXTENSIONS.has(extension)) continue

    const content = await entry.async("string")
    const baseDir = getDirname(entry.name)

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

      if (next !== content) zip.file(entry.name, next)

      continue
    }

    const next = rewriteTextReferences(content, baseDir, renamedPaths)

    if (next !== content) zip.file(entry.name, next)
  }
}
