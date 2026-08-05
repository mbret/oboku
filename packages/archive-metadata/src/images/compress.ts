import {
  type EditableArchive,
  type EntryContent,
  readEntryArrayBuffer,
} from "../update/editableArchive"
import { report } from "../utils/report"
import type { StageBytes } from "../update/staging"
import {
  getPreservableImageMediaType,
  isConvertibleImagePath,
  replaceExtensionWithWebp,
  WEBP_MEDIA_TYPE,
  type PreservableImageMediaType,
} from "./paths"
import { createImageCompressionPool } from "./compressionPool"
import { mapWithConcurrency } from "../utils/mapWithConcurrency"
import { rewriteImageReferences } from "./rewriteReferences"
import type { ImageCompressionConfig, ImageCompressionResult } from "./types"

const MAX_IMAGE_COMPRESSION_CONCURRENCY = 2

type CompressibleImage = {
  path: string
  content: EntryContent
  outputType: PreservableImageMediaType | typeof WEBP_MEDIA_TYPE
}

const listCompressibleImages = (
  entries: EditableArchive,
  outputMode: ImageCompressionConfig["outputMode"],
): CompressibleImage[] => {
  const images: CompressibleImage[] = []

  for (const [path, entry] of entries) {
    if (entry.dir) continue

    if (outputMode === "webp") {
      if (isConvertibleImagePath(path)) {
        images.push({
          path,
          content: entry.content,
          outputType: WEBP_MEDIA_TYPE,
        })
      }

      continue
    }

    const outputType = getPreservableImageMediaType(path)

    if (outputType) images.push({ path, content: entry.content, outputType })
  }

  return images
}

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
    stageBytes,
    onProgress,
  }: {
    stageBytes: StageBytes
    onProgress?: (completed: number, total: number) => void
  },
): Promise<ImageCompressionResult> => {
  const images = listCompressibleImages(entries, config.outputMode)
  const total = images.length

  if (total === 0)
    return { totalImages: 0, compressedCount: 0, skippedCount: 0 }

  const collidingNames =
    config.outputMode === "webp"
      ? findCollidingWebpTargets(entries, images)
      : new Set<string>()

  const compressionConcurrency = Math.min(
    navigator.hardwareConcurrency || MAX_IMAGE_COMPRESSION_CONCURRENCY,
    MAX_IMAGE_COMPRESSION_CONCURRENCY,
  )
  const pool = createImageCompressionPool(compressionConcurrency)
  const renamedPaths = new Set<string>()
  let completed = 0
  let compressedCount = 0
  let skippedCount = 0

  try {
    await mapWithConcurrency(
      images,
      compressionConcurrency,
      async function compressImage(image) {
        if (collidingNames.has(image.path)) {
          skippedCount += 1
          completed += 1
          onProgress?.(completed, total)

          return
        }

        const original = await readEntryArrayBuffer(image.content)
        const result = await pool.compress(original, {
          maxWidth: config.maxWidth,
          maxHeight: config.maxHeight,
          outputType: image.outputType,
          skipIfUnscaled: config.outputMode === "original",
        })

        if (result.status === "ok") {
          const oldPath = image.path
          const newPath =
            config.outputMode === "webp"
              ? replaceExtensionWithWebp(oldPath)
              : oldPath

          if (newPath !== oldPath) {
            entries.delete(oldPath)
            renamedPaths.add(oldPath)
          }

          entries.set(newPath, {
            dir: false,
            content: await stageBytes(result.bytes),
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

  report.info("image compression", {
    outputMode: config.outputMode,
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
