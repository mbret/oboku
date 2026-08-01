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

export type { PatchMetadataAction } from "./update/actions"
export type { ArchiveUpdateResult } from "./update/updateArchive"
