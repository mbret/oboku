import type { ImageCompressionConfig } from "../images/types"
import type {
  ArchiveMetadataPatch,
  ArchiveMetadataTargets,
} from "../metadata/write"

/** Rewrites the archive's metadata containers. */
export type PatchMetadataAction = {
  kind: "patch-metadata"
  patch: ArchiveMetadataPatch
  targets: ArchiveMetadataTargets
}

/**
 * Resizes the archive's images and optionally re-encodes them to WebP. Needs a
 * canvas-and-worker runtime.
 */
export type CompressImagesAction = {
  kind: "compress-images"
  config: ImageCompressionConfig
}
