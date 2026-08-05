import type { Archive } from "./archive/types"
import type { PatchMetadataAction } from "./update/actions"
import { openInMemoryStagingScope } from "./update/staging"
import {
  type ArchiveUpdateOptions,
  type ArchiveUpdateResult,
  type ArchiveUpdateRuntime,
  runArchiveUpdate,
} from "./update/updateArchive"

export * from "./common"

export type NodeArchiveUpdateAction = PatchMetadataAction

const nodeRuntime: ArchiveUpdateRuntime = {
  openStagingScope: openInMemoryStagingScope,
  compressImages: undefined,
}

/**
 * Applies `actions` to `archive` and returns the rewritten container.
 *
 * Node accepts metadata actions only: image re-encoding needs a canvas runtime,
 * and staging needs a filesystem this package does not reach for, so the whole
 * archive is assembled in memory. Both are why `compress-images` is absent from
 * {@link NodeArchiveUpdateAction} rather than failing at runtime.
 *
 * XML rewriting still requires `DOMParser`/`XMLSerializer` on `globalThis`.
 */
export const updateArchive = (
  archive: Archive,
  options: ArchiveUpdateOptions<NodeArchiveUpdateAction>,
): Promise<ArchiveUpdateResult> =>
  runArchiveUpdate(nodeRuntime, archive, options)
