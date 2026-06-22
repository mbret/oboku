import { BlobWriter, Uint8ArrayReader, ZipWriter } from "@zip.js/zip.js"
import { Logger } from "../../../debug/logger.shared"
import { type EditableArchive, readEntryBytes } from "./editableArchive"

const OPFS_TMP_DIR = "oboku-optimize-tmp"

const opfsSupported = (): boolean =>
  typeof navigator !== "undefined" &&
  typeof navigator.storage?.getDirectory === "function"

const addEntriesToZip = async (
  writer: ZipWriter<unknown>,
  entries: EditableArchive,
): Promise<void> => {
  for (const [path, entry] of entries) {
    if (entry.dir) {
      await writer.add(path, undefined, { directory: true })
      continue
    }

    await writer.add(
      path,
      new Uint8ArrayReader(await readEntryBytes(entry.content)),
      entry.store
        ? { level: 0, dataDescriptor: false, extendedTimestamp: false }
        : {},
    )
  }
}

export type WrittenArchive = {
  blob: Blob
  close: () => Promise<void>
}

const createFreshTempFile = async (): Promise<{
  handle: FileSystemFileHandle
  remove: () => Promise<void>
}> => {
  const root = await navigator.storage.getDirectory()
  const previousRunLeftovers = root
    .removeEntry(OPFS_TMP_DIR, { recursive: true })
    .catch(() => {})

  await previousRunLeftovers

  const dir = await root.getDirectoryHandle(OPFS_TMP_DIR, { create: true })
  const name = `${crypto.randomUUID()}.zip`
  const handle = await dir.getFileHandle(name, { create: true })

  return { handle, remove: () => dir.removeEntry(name).catch(() => {}) }
}

const writeArchiveToOpfs = async (
  entries: EditableArchive,
): Promise<WrittenArchive | null> => {
  if (!opfsSupported()) {
    Logger.info("[archiveWriter] OPFS unavailable, using in-memory blob")

    return null
  }

  try {
    const { handle, remove } = await createFreshTempFile()
    const diskBackedZipStream = await handle.createWritable()
    const writer = new ZipWriter(diskBackedZipStream)

    await addEntriesToZip(writer, entries)
    await writer.close()

    const streamedFile = await handle.getFile()

    Logger.info("[archiveWriter] streamed archive to OPFS", {
      bytes: streamedFile.size,
    })

    return { blob: streamedFile, close: remove }
  } catch (error) {
    Logger.warn(
      "[archiveWriter] OPFS streaming failed, falling back to in-memory blob",
      error,
    )

    return null
  }
}

const writeArchiveToBlob = async (
  entries: EditableArchive,
  mimeType: string,
): Promise<WrittenArchive> => {
  const writer = new ZipWriter(new BlobWriter(mimeType))

  await addEntriesToZip(writer, entries)

  const blob = await writer.close()

  Logger.info("[archiveWriter] wrote in-memory archive", {
    mimeType,
    bytes: blob.size,
  })

  return { blob, close: () => Promise.resolve() }
}

export const writeArchive = async (
  entries: EditableArchive,
  mimeType: string,
): Promise<WrittenArchive> => {
  Logger.info("[archiveWriter] writing archive", {
    mimeType,
    entries: entries.size,
  })

  return (
    (await writeArchiveToOpfs(entries, mimeType)) ??
    (await writeArchiveToBlob(entries, mimeType))
  )
}
