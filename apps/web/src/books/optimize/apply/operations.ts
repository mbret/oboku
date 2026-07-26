import type { ArchiveMetadataPatchPlan } from "../metadata/targets"
import type { ImageCompressionConfig } from "../content/types"

export type OptimizeOperation =
  | { kind: "metadata-patch"; plan: ArchiveMetadataPatchPlan }
  | { kind: "compress-images"; config: ImageCompressionConfig }
