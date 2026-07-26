import type { ImageCompressionConfig } from "../images/types"
import type { ArchiveMetadataPatch, ArchiveMetadataTargets } from "../writer"

/**
 * Rewrites the archive's metadata containers. Available in every runtime — it
 * only rewrites XML.
 */
export type PatchMetadataAction = {
  kind: "patch-metadata"
  patch: ArchiveMetadataPatch
  targets: ArchiveMetadataTargets
}

/**
 * Re-encodes the archive's images to WebP and rewrites every reference to them.
 * Needs a canvas-and-worker runtime, so only the web entrypoint accepts it.
 */
export type CompressImagesAction = {
  kind: "compress-images"
  config: ImageCompressionConfig
}
