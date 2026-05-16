export type { ArchiveEntry, ArchiveSource } from "./archive/types"
export { findEntry } from "./archive/types"

export type { ArchiveMetadata, ReadArchiveMetadataEvents } from "./reader"
export { readArchiveMetadata } from "./reader"

export type {
  ArchiveMetadataPatch,
  ArchiveMetadataTargets,
  ArchivePatch,
  ArchivePatchedEntry,
} from "./writer"
export { patchArchiveMetadata } from "./writer"

export { normalizeIsbn } from "@prose-reader/archive-parser"
