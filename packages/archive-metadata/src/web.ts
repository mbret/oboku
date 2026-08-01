import type { Archive } from "./archive/types"
import type { PatchMetadataAction } from "./update/actions"
import { openOpfsStagingScope } from "./update/opfsStaging"
import {
  type ArchiveUpdateOptions,
  type ArchiveUpdateResult,
  type ArchiveUpdateRuntime,
  runArchiveUpdate,
} from "./update/updateArchive"

export * from "./common"

export { purgeStagedFiles } from "./update/opfsStaging"

export type WebArchiveUpdateAction = PatchMetadataAction

const webRuntime: ArchiveUpdateRuntime = {
  openStagingScope: openOpfsStagingScope,
}

/**
 * Applies `actions` to `archive` and returns the rewritten container. The output
 * is staged in OPFS rather than assembled in memory, so peak memory stays close
 * to a single entry rather than the whole book.
 */
export const updateArchive = (
  archive: Archive,
  options: ArchiveUpdateOptions<WebArchiveUpdateAction>,
): Promise<ArchiveUpdateResult> =>
  runArchiveUpdate(webRuntime, archive, options)
