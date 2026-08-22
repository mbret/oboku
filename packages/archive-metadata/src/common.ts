export type {
  Archive,
  ArchiveFileRecord,
  ArchiveRecord,
} from "./archive/types"
export { isFileRecord } from "./archive/types"

export { archiveMetadataIsbn } from "./metadata/isbn"

export type {
  ArchiveMetadataPatch,
  ArchiveMetadataTargets,
  ArchivePatch,
  ArchivePatchedEntry,
} from "./metadata/write"
export { patchArchiveMetadata } from "./metadata/write"

export type { PatchMetadataAction } from "./update/actions"
export type {
  ArchiveUpdateProgress,
  ArchiveUpdateResult,
} from "./update/updateArchive"
