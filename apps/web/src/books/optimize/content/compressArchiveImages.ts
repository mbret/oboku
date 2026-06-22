import {
  type EditableArchive,
  type EntryContent,
  readEntryArrayBuffer,
} from "../editableArchive"
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
  entries: EditableArchive,
  images: { path: string }[],
): Set<string> => {
  const existingNames = new Set(entries.keys())
  const targetToSources = new Map<string, string[]>()

  for (const { path } of images) {
    const target = replaceExtensionWithWebp(path)
    const sources = targetToSources.get(target) ?? []

    sources.push(path)
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
  entries: EditableArchive,
  config: ImageCompressionConfig,
  {
    onProgress,
  }: { onProgress?: (completed: number, total: number) => void } = {},
): Promise<ImageCompressionResult> => {
  const images: { path: string; content: EntryContent }[] = [...entries]
    .filter(([path, entry]) => !entry.dir && isConvertibleImagePath(path))
    .map(([path, entry]) => ({ path, content: entry.content }))
  const total = images.length

  if (total === 0)
    return { totalImages: 0, compressedCount: 0, skippedCount: 0 }

  const collidingNames = findCollidingWebpTargets(entries, images)

  const pool = createImageCompressionPool()
  const renamedPaths = new Set<string>()
  let completed = 0
  let compressedCount = 0
  let skippedCount = 0

  try {
    await mapWithConcurrency(
      images,
      navigator.hardwareConcurrency || 4,
      async (image) => {
        if (collidingNames.has(image.path)) {
          skippedCount += 1
          completed += 1
          onProgress?.(completed, total)

          return
        }

        const original = await readEntryArrayBuffer(image.content)
        const originalByteLength = original.byteLength
        const result = await pool.compress(
          original,
          config.maxWidth,
          config.maxHeight,
        )

        const isSmaller =
          result.status === "ok" && result.bytes.byteLength < originalByteLength

        if (result.status === "ok" && isSmaller) {
          const oldPath = image.path
          const newPath = replaceExtensionWithWebp(oldPath)

          if (newPath !== oldPath) {
            entries.delete(oldPath)
            renamedPaths.add(oldPath)
          }

          entries.set(newPath, {
            dir: false,
            content: new Uint8Array(result.bytes),
          })
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

  await rewriteImageReferences(entries, renamedPaths)

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
