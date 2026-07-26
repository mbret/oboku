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
