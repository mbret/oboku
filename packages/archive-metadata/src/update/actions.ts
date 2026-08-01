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
