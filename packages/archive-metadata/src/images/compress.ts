import {
  type EditableArchive,
  type EntryContent,
  readEntryArrayBuffer,
} from "../update/editableArchive"
import { report } from "../utils/report"
import type { StageBytes } from "../update/staging"
import {
  getConvertedImageMediaType,
  getPreservableImageMediaType,
  isConvertibleImagePath,
  replaceExtensionWithConvertedFormat,
} from "./paths"
import { createImageCompressionPool } from "./compressionPool"
import { mapWithConcurrency } from "../utils/mapWithConcurrency"
import { rewriteImageReferences } from "./rewriteReferences"
import type {
  ConvertedImageOutputMode,
  ImageCompressionConfig,
  ImageCompressionResult,
} from "./types"
import type { ImageOutputMediaType } from "./compression.types"

const MAX_IMAGE_COMPRESSION_CONCURRENCY = 2
const MAX_AVIF_COMPRESSION_CONCURRENCY = 4
const MIN_CORES_FOR_TWO_AVIF_WORKERS = 6
const MIN_CORES_FOR_FOUR_AVIF_WORKERS = 8

const getCompressionConcurrency = (
  outputMode: ImageCompressionConfig["outputMode"],
): number => {
  const availableCores = navigator.hardwareConcurrency || 1

  if (outputMode === "avif") {
    if (globalThis.crossOriginIsolated) return 1
    if (availableCores >= MIN_CORES_FOR_FOUR_AVIF_WORKERS) {
      return MAX_AVIF_COMPRESSION_CONCURRENCY
    }
    if (availableCores >= MIN_CORES_FOR_TWO_AVIF_WORKERS) {
      return 2
    }

    return 1
  }

  return Math.min(availableCores, MAX_IMAGE_COMPRESSION_CONCURRENCY)
}

type CompressibleImage = {
  path: string
  content: EntryContent
  outputType: ImageOutputMediaType
}

const listCompressibleImages = (
  entries: EditableArchive,
  outputMode: ImageCompressionConfig["outputMode"],
): CompressibleImage[] => {
  const images: CompressibleImage[] = []

  for (const [path, entry] of entries) {
    if (entry.dir) continue

    if (outputMode !== "original") {
      if (isConvertibleImagePath(path)) {
        images.push({
          path,
          content: entry.content,
          outputType: getConvertedImageMediaType(outputMode),
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
 * Identifies images whose converted target would clash with another archive
 * entry — either because two originals collapse to the same name (e.g.
 * `cover.jpg` and `cover.png` both becoming the same target) or because the
 * target already exists in the archive.
 *
 * Converting such images would overwrite a different file and rewrite both
 * references to the same surviving bytes, corrupting those pages. We do not yet
 * resolve collisions by generating unique names, so for now we deliberately
 * skip every entry involved in a clash and leave the originals untouched.
 *
 * TODO: resolve collisions by generating unique targets (and updating
 * references accordingly) instead of skipping the conversion entirely.
 */
const findCollidingConvertedTargets = (
  entries: EditableArchive,
  images: { path: string }[],
  outputMode: ConvertedImageOutputMode,
): Set<string> => {
  const existingNames = new Set(entries.keys())
  const targetToSources = new Map<string, string[]>()

  for (const { path } of images) {
    const target = replaceExtensionWithConvertedFormat(path, outputMode)
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
    config.outputMode === "original"
      ? new Set<string>()
      : findCollidingConvertedTargets(entries, images, config.outputMode)

  const compressionConcurrency = getCompressionConcurrency(config.outputMode)
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
            config.outputMode === "original"
              ? oldPath
              : replaceExtensionWithConvertedFormat(oldPath, config.outputMode)

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

  if (config.outputMode !== "original") {
    await rewriteImageReferences(entries, renamedPaths, config.outputMode)
  }

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
