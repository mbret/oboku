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

const createFreshTempFileHandle = async (): Promise<FileSystemFileHandle> => {
  const root = await navigator.storage.getDirectory()
  const previousRunLeftovers = root
    .removeEntry(OPFS_TMP_DIR, { recursive: true })
    .catch(() => {})

  await previousRunLeftovers

  const dir = await root.getDirectoryHandle(OPFS_TMP_DIR, { create: true })

  return dir.getFileHandle(`${crypto.randomUUID()}.zip`, { create: true })
}

const writeArchiveToOpfs = async (
  entries: EditableArchive,
  mimeType: string,
): Promise<File | null> => {
  if (!opfsSupported()) {
    Logger.info("[archiveWriter] OPFS unavailable, using in-memory blob")

    return null
  }

  try {
    const handle = await createFreshTempFileHandle()
    const diskBackedZipStream = await handle.createWritable()
    const writer = new ZipWriter(diskBackedZipStream)

    await addEntriesToZip(writer, entries)
    await writer.close()

    const streamedFile = await handle.getFile()

    Logger.info("[archiveWriter] streamed archive to OPFS", {
      mimeType,
      bytes: streamedFile.size,
    })

    return new File([streamedFile], streamedFile.name, { type: mimeType })
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
): Promise<Blob> => {
  const writer = new ZipWriter(new BlobWriter(mimeType))

  await addEntriesToZip(writer, entries)

  const blob = await writer.close()

  Logger.info("[archiveWriter] wrote in-memory archive", {
    mimeType,
    bytes: blob.size,
  })

  return blob
}

export const writeArchive = async (
  entries: EditableArchive,
  mimeType: string,
): Promise<Blob> => {
  Logger.info("[archiveWriter] writing archive", {
    mimeType,
    entries: entries.size,
  })

  return (
    (await writeArchiveToOpfs(entries, mimeType)) ??
    (await writeArchiveToBlob(entries, mimeType))
  )
}
