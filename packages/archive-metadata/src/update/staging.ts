/**
 * Parks freshly produced entry bytes somewhere the pipeline can read them back
 * later, so an archive with hundreds of rewritten images does not have to keep
 * every version resident. Runtimes that can spill to disk return a file-backed
 * blob; the rest keep the bytes in memory.
 */
export type StageBytes = (bytes: ArrayBuffer) => Promise<Blob>

export const stageBytesInMemory: StageBytes = async (bytes) => new Blob([bytes])

/**
 * Destination the zip writer streams into. `finish` resolves once the archive is
 * complete; `dispose` drops the destination when it is no longer needed.
 */
export type ZipTarget = {
  stream: WritableStream<Uint8Array>
  finish: () => Promise<Blob>
  dispose: () => Promise<void>
}

/**
 * Opens a streaming destination for the output archive, or returns `null` when
 * the runtime has none — the writer then builds the archive in memory.
 */
export type OpenZipTarget = () => Promise<ZipTarget | null>

export const openNoZipTarget: OpenZipTarget = async () => null

/**
 * Everything one update stages, scoped so that concurrent updates — in this
 * context or another one — never stage into the same place. `release` drops the
 * whole scope, and must not be called while the update's output blob can still
 * be read: staged blobs reference their backing storage rather than copying it.
 */
export type StagingScope = {
  stageBytes: StageBytes
  openZipTarget: OpenZipTarget
  release: () => Promise<void>
}

export type OpenStagingScope = () => Promise<StagingScope>

export const openInMemoryStagingScope: OpenStagingScope = async () => ({
  stageBytes: stageBytesInMemory,
  openZipTarget: openNoZipTarget,
  release: () => Promise.resolve(),
})
