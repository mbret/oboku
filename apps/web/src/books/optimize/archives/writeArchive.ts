import { BlobWriter, Uint8ArrayReader, ZipWriter } from "@zip.js/zip.js"
import { Logger } from "../../../debug/logger.shared"
import { type EditableArchive, readEntryBytes } from "./editableArchive"
import { getTmpDir, opfsSupported } from "../../../storage/tmp"
import { OPTIMIZE_TMP_SCOPE } from "../constants"

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

const createTempFile = async (): Promise<{
  handle: FileSystemFileHandle
  remove: () => Promise<void>
}> => {
  const dir = await getTmpDir(OPTIMIZE_TMP_SCOPE)
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
    const { handle, remove } = await createTempFile()
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
): Promise<WrittenArchive> => {
  const writer = new ZipWriter(new BlobWriter())

  await addEntriesToZip(writer, entries)

  const blob = await writer.close()

  Logger.info("[archiveWriter] wrote in-memory archive", {
    bytes: blob.size,
  })

  return { blob, close: () => Promise.resolve() }
}

export const writeArchive = async (
  entries: EditableArchive,
): Promise<WrittenArchive> => {
  Logger.info("[archiveWriter] writing archive", {
    entries: entries.size,
  })

  return (
    (await writeArchiveToOpfs(entries)) ?? (await writeArchiveToBlob(entries))
  )
}
