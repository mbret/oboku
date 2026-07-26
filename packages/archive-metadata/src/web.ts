import type { Archive } from "./archive/types"
import { compressArchiveImages } from "./images/compress"
import type {
  CompressImagesAction,
  PatchMetadataAction,
} from "./update/actions"
import { openOpfsZipTarget, stageBytesInOpfs } from "./update/opfsStaging"
import {
  type ArchiveUpdateOptions,
  type ArchiveUpdateResult,
  type ArchiveUpdateRuntime,
  runArchiveUpdate,
} from "./update/updateArchive"

export * from "./common"

export type { CompressImagesAction } from "./update/actions"
export type { ImageCompressionConfig } from "./images/types"
export { CONVERTIBLE_IMAGE_FORMAT_NAMES } from "./images/paths"
export type { ImageResolution } from "./images/inspect"
export {
  listImageEntries,
  measureAverageImageResolution,
} from "./images/inspect"
export { purgeStagedFiles } from "./update/opfsStaging"

export type WebArchiveUpdateAction = PatchMetadataAction | CompressImagesAction

const webRuntime: ArchiveUpdateRuntime = {
  stageBytes: stageBytesInOpfs,
  openZipTarget: openOpfsZipTarget,
  compressImages: (entries, action, { stageBytes, onProgress }) =>
    compressArchiveImages(entries, action.config, { stageBytes, onProgress }),
}

/**
 * Applies `actions` to `archive` and returns the rewritten container. Images are
 * re-encoded in a worker pool and every intermediate — the converted images and
 * the output archive itself — is staged in OPFS when available, so peak memory
 * stays close to a single entry rather than the whole book.
 */
export const updateArchive = (
  archive: Archive,
  options: ArchiveUpdateOptions<WebArchiveUpdateAction>,
): Promise<ArchiveUpdateResult> =>
  runArchiveUpdate(webRuntime, archive, options)
