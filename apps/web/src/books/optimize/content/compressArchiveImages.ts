import type JSZip from "jszip"
import { Logger } from "../../../debug/logger.shared"
import {
  getBasename,
  getExtension,
  isImagePath,
  replaceExtensionWithWebp,
} from "./images"
import { createImageCompressionPool } from "./imageCompressionPool"
import type { ImageCompressionConfig, ImageCompressionResult } from "./types"

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

type Rename = {
  oldPath: string
  newPath: string
  bytes: ArrayBuffer
}

const mapWithConcurrency = async <T>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<void>,
): Promise<void> => {
  let cursor = 0

  const run = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      const item = items[index]
      if (item === undefined) return
      await task(item, index)
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, run),
  )
}

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const rewriteTextReferences = (
  content: string,
  renames: ReadonlyArray<[string, string]>,
): string =>
  renames.reduce((current, [oldBasename, newBasename]) => {
    const pattern = new RegExp(
      `(?<![\\w.\\-])${escapeRegExp(oldBasename)}(?![\\w])`,
      "g",
    )

    return current.replace(pattern, newBasename)
  }, content)

const rewriteOpfManifest = (
  xml: string,
  basenameMap: Map<string, string>,
): string | undefined => {
  const doc = new DOMParser().parseFromString(xml, "application/xml")

  if (doc.getElementsByTagName("parsererror").length > 0) return undefined

  const items = doc.getElementsByTagNameNS("*", "item")
  let changed = false

  for (const item of Array.from(items)) {
    const href = item.getAttribute("href")
    if (!href) continue

    const basename = getBasename(href)
    const newBasename = basenameMap.get(basename)
    if (!newBasename) continue

    item.setAttribute(
      "href",
      `${href.substring(0, href.length - basename.length)}${newBasename}`,
    )
    item.setAttribute("media-type", WEBP_MEDIA_TYPE)
    changed = true
  }

  if (!changed) return undefined

  return new XMLSerializer().serializeToString(doc)
}

const rewriteReferences = async (
  zip: JSZip,
  basenameMap: Map<string, string>,
): Promise<void> => {
  if (basenameMap.size === 0) return

  const renames = [...basenameMap.entries()].sort(
    ([a], [b]) => b.length - a.length,
  )

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue

    const extension = getExtension(entry.name)
    const isOpf = extension === OPF_EXTENSION

    if (!isOpf && !TEXT_REFERENCE_EXTENSIONS.has(extension)) continue

    const content = await entry.async("string")

    if (isOpf) {
      const manifestRewritten = rewriteOpfManifest(content, basenameMap)
      const next = rewriteTextReferences(manifestRewritten ?? content, renames)

      if (next !== content) zip.file(entry.name, next)

      continue
    }

    const next = rewriteTextReferences(content, renames)

    if (next !== content) zip.file(entry.name, next)
  }
}

export const compressArchiveImages = async (
  zip: JSZip,
  config: ImageCompressionConfig,
  {
    onProgress,
  }: { onProgress?: (completed: number, total: number) => void } = {},
): Promise<ImageCompressionResult> => {
  const images = Object.values(zip.files).filter(
    (entry) => !entry.dir && isImagePath(entry.name),
  )
  const total = images.length

  if (total === 0)
    return { totalImages: 0, compressedCount: 0, skippedCount: 0 }

  const pool = createImageCompressionPool()
  const renames: Rename[] = []
  let completed = 0
  let skippedCount = 0

  try {
    await mapWithConcurrency(
      images,
      navigator.hardwareConcurrency || 4,
      async (entry) => {
        const original = await entry.async("arraybuffer")
        const originalByteLength = original.byteLength
        const result = await pool.compress(
          original,
          config.maxWidth,
          config.maxHeight,
        )

        const isSmaller =
          result.status === "ok" && result.bytes.byteLength < originalByteLength

        if (result.status === "ok" && isSmaller) {
          renames.push({
            oldPath: entry.name,
            newPath: replaceExtensionWithWebp(entry.name),
            bytes: result.bytes,
          })
        } else {
          skippedCount += 1
        }

        completed += 1
        onProgress?.(completed, total)
      },
    )
  } finally {
    pool.terminate()
  }

  const basenameMap = new Map<string, string>()

  for (const { oldPath, newPath, bytes } of renames) {
    if (newPath !== oldPath) {
      zip.remove(oldPath)
      basenameMap.set(getBasename(oldPath), getBasename(newPath))
    }

    zip.file(newPath, new Uint8Array(bytes))
  }

  await rewriteReferences(zip, basenameMap)

  Logger.info("[contentOptimizer] image compression", {
    totalImages: total,
    compressedCount: renames.length,
    skippedCount,
  })

  return {
    totalImages: total,
    compressedCount: renames.length,
    skippedCount,
  }
}
