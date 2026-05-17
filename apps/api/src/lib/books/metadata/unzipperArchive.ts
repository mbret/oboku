import type { ArchiveEntry, ArchiveSource } from "@oboku/archive-metadata"
import unzipper from "unzipper"

type CentralDirectoryFile = Awaited<
  ReturnType<typeof unzipper.Open.file>
>["files"][number]

const toArchiveEntry = (file: CentralDirectoryFile): ArchiveEntry => ({
  path: file.path,
  isDir: file.type === "Directory",
  size: file.uncompressedSize,
  readAsString: async () => (await file.buffer()).toString("utf8"),
  readAsUint8Array: async () => {
    const buffer = await file.buffer()

    // `Buffer` is a `Uint8Array` subclass; return a plain Uint8Array so
    // `@oboku/archive-metadata` stays free of Node-specific types.
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  },
})

/**
 * Adapt a zip file on disk to the runtime-agnostic `ArchiveSource`
 * interface consumed by `@oboku/archive-metadata`. Uses
 * `unzipper.Open.file` (random-access via the central directory) so
 * individual entries are still decoded lazily — the metadata package
 * only touches the handful it needs (e.g. OPF, ComicInfo.xml) and the
 * rest remain on disk.
 */
export const createUnzipperArchiveSource = async (
  filePath: string,
): Promise<ArchiveSource & { close: () => Promise<void> }> => {
  const directory = await unzipper.Open.file(filePath)

  const entries = directory.files.map(toArchiveEntry)

  return {
    listEntries: async () => entries,
    // `unzipper.Open.file` doesn't expose an explicit close hook — the
    // underlying FDs are released per-entry when `buffer()` resolves.
    // We keep a no-op close so callers can treat the adapter as
    // disposable without branching on the runtime.
    close: async () => {},
  }
}
