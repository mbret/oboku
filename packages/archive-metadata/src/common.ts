export type {
  Archive,
  ArchiveFileRecord,
  ArchiveRecord,
} from "./archive/types"
export { isFileRecord } from "./archive/types"

export type {
  ArchiveMetadataIdentifier,
  ArchiveMetadataPatch,
  ArchiveMetadataTargets,
  ArchivePatch,
  ArchivePatchedEntry,
} from "./metadata/write"
export { patchArchiveMetadata } from "./metadata/write"
export { isComicInfoWritableIdentifierScheme } from "./comicInfo"
export {
  UNTAGGED_IDENTIFIER_SCHEME,
  URL_IDENTIFIER_SCHEME,
} from "./metadata/identifiers"

export type { PatchMetadataAction } from "./update/actions"
export type {
  ArchiveUpdateProgress,
  ArchiveUpdateResult,
} from "./update/updateArchive"
