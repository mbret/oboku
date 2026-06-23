import { Logger } from "../debug/logger.shared"

const TMP_ROOT = "oboku-tmp"

export const opfsSupported = (): boolean =>
  typeof navigator !== "undefined" &&
  typeof navigator.storage?.getDirectory === "function"

const getTmpRoot = async (): Promise<FileSystemDirectoryHandle> => {
  const root = await navigator.storage.getDirectory()

  return root.getDirectoryHandle(TMP_ROOT, { create: true })
}

export const getTmpDir = async (
  scope: string,
): Promise<FileSystemDirectoryHandle> =>
  (await getTmpRoot()).getDirectoryHandle(scope, { create: true })

export const writeTmpFile = async (
  scope: string,
  bytes: ArrayBuffer,
): Promise<Blob> => {
  if (!opfsSupported()) return new Blob([bytes])

  try {
    const dir = await getTmpDir(scope)
    const handle = await dir.getFileHandle(`${crypto.randomUUID()}.bin`, {
      create: true,
    })
    const stream = await handle.createWritable()

    await stream.write(bytes)
    await stream.close()

    return handle.getFile()
  } catch (error) {
    Logger.warn(`[tmp:${scope}] write failed, keeping bytes in memory`, error)

    return new Blob([bytes])
  }
}

export const purgeTmpDir = async (scope: string): Promise<void> => {
  if (!opfsSupported()) return

  try {
    await (await getTmpRoot()).removeEntry(scope, { recursive: true })

    Logger.info(`[tmp:${scope}] purged`)
  } catch (error) {
    Logger.info(`[tmp:${scope}] nothing to purge`, error)
  }
}

export const purgeTmp = async (): Promise<void> => {
  if (!opfsSupported()) return

  try {
    const root = await navigator.storage.getDirectory()

    await root.removeEntry(TMP_ROOT, { recursive: true })

    Logger.info("[tmp] purged tmp root")
  } catch (error) {
    Logger.info("[tmp] nothing to purge", error)
  }
}
