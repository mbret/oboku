export type {
  Archive,
  ArchiveFileRecord,
  ArchiveRecord,
} from "./archive/types"
export { isFileRecord } from "./archive/types"

export type {
  ArchiveMetadataPatch,
  ArchiveMetadataTargets,
  ArchivePatch,
  ArchivePatchedEntry,
} from "./writer"
export { patchArchiveMetadata } from "./writer"
