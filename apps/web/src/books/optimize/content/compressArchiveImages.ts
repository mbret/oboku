import type JSZip from "jszip"
import { Logger } from "../../../debug/logger.shared"
import { isConvertibleImagePath, replaceExtensionWithWebp } from "./images"
import { createImageCompressionPool } from "./imageCompressionPool"
import { mapWithConcurrency } from "./mapWithConcurrency"
import { rewriteImageReferences } from "./rewriteImageReferences"
import type { ImageCompressionConfig, ImageCompressionResult } from "./types"

/**
 * Identifies images whose `.webp` target would clash with another archive
 * entry — either because two originals collapse to the same name (e.g.
 * `cover.jpg` and `cover.png` both becoming `cover.webp`) or because the target
 * already exists in the archive (e.g. a pre-existing `cover.webp`).
 *
 * Converting such images would overwrite a different file and rewrite both
 * references to the same surviving bytes, corrupting those pages. We do not yet
 * resolve collisions by generating unique names, so for now we deliberately
 * skip every entry involved in a clash and leave the originals untouched.
 *
 * TODO: resolve collisions by generating unique `.webp` targets (and updating
 * references accordingly) instead of skipping the conversion entirely.
 */
const findCollidingWebpTargets = (
  zip: JSZip,
  images: JSZip.JSZipObject[],
): Set<string> => {
  const existingNames = new Set(Object.keys(zip.files))
  const targetToSources = new Map<string, string[]>()

  for (const entry of images) {
    const target = replaceExtensionWithWebp(entry.name)
    const sources = targetToSources.get(target) ?? []

    sources.push(entry.name)
    targetToSources.set(target, sources)
  }

  const colliding = new Set<string>()

  for (const [target, sources] of targetToSources) {
    const overwritesUnrelatedEntry = sources.some(
      (source) => source !== target && existingNames.has(target),
    )

    if (sources.length > 1 || overwritesUnrelatedEntry) {
      for (const source of sources) colliding.add(source)
    }
  }

  return colliding
}

export const compressArchiveImages = async (
  zip: JSZip,
  config: ImageCompressionConfig,
  {
    onProgress,
  }: { onProgress?: (completed: number, total: number) => void } = {},
): Promise<ImageCompressionResult> => {
  const images = Object.values(zip.files).filter(
    (entry) => !entry.dir && isConvertibleImagePath(entry.name),
  )
  const total = images.length

  if (total === 0)
    return { totalImages: 0, compressedCount: 0, skippedCount: 0 }

  const collidingNames = findCollidingWebpTargets(zip, images)

  const pool = createImageCompressionPool()
  const renamedPaths = new Set<string>()
  let completed = 0
  let compressedCount = 0
  let skippedCount = 0

  try {
    await mapWithConcurrency(
      images,
      navigator.hardwareConcurrency || 4,
      async (entry) => {
        if (collidingNames.has(entry.name)) {
          skippedCount += 1
          completed += 1
          onProgress?.(completed, total)

          return
        }

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
          const oldPath = entry.name
          const newPath = replaceExtensionWithWebp(oldPath)

          if (newPath !== oldPath) {
            zip.remove(oldPath)
            renamedPaths.add(oldPath)
          }

          zip.file(newPath, new Uint8Array(result.bytes))
          compressedCount += 1
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

  await rewriteImageReferences(zip, renamedPaths)

  Logger.info("[contentOptimizer] image compression", {
    totalImages: total,
    compressedCount,
    skippedCount,
  })

  return {
    totalImages: total,
    compressedCount,
    skippedCount,
  }
}
