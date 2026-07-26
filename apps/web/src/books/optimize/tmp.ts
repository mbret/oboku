import { Logger } from "../../debug/logger.shared"

const TMP_ROOT = "oboku-tmp"
const TMP_DIR = "optimize"

export const opfsSupported = (): boolean =>
  typeof navigator !== "undefined" &&
  typeof navigator.storage?.getDirectory === "function"

const getTmpRoot = async (): Promise<FileSystemDirectoryHandle> => {
  const root = await navigator.storage.getDirectory()

  return root.getDirectoryHandle(TMP_ROOT, { create: true })
}

export const getTmpDir = async (): Promise<FileSystemDirectoryHandle> =>
  (await getTmpRoot()).getDirectoryHandle(TMP_DIR, { create: true })

export const writeTmpFile = async (bytes: ArrayBuffer): Promise<Blob> => {
  if (!opfsSupported()) return new Blob([bytes])

  try {
    const dir = await getTmpDir()
    const handle = await dir.getFileHandle(`${crypto.randomUUID()}.bin`, {
      create: true,
    })
    const stream = await handle.createWritable()

    await stream.write(bytes)
    await stream.close()

    return handle.getFile()
  } catch (error) {
    Logger.warn("[optimize:tmp] write failed, keeping bytes in memory", error)

    return new Blob([bytes])
  }
}

export const purgeTmp = async (): Promise<void> => {
  if (!opfsSupported()) return

  try {
    await (await getTmpRoot()).removeEntry(TMP_DIR, { recursive: true })

    Logger.info("[optimize:tmp] purged")
  } catch (error) {
    Logger.info("[optimize:tmp] nothing to purge", error)
  }
}
