import { report } from "../utils/report"
import type { OpenZipTarget, StageBytes } from "./staging"

const STAGING_DIR = "oboku-tmp"

export const opfsSupported = (): boolean =>
  typeof navigator !== "undefined" &&
  typeof navigator.storage?.getDirectory === "function"

const getStagingDir = async (): Promise<FileSystemDirectoryHandle> => {
  const root = await navigator.storage.getDirectory()

  return root.getDirectoryHandle(STAGING_DIR, { create: true })
}

const createStagedFile = async (
  extension: string,
): Promise<{ handle: FileSystemFileHandle; remove: () => Promise<void> }> => {
  const dir = await getStagingDir()
  const name = `${crypto.randomUUID()}.${extension}`
  const handle = await dir.getFileHandle(name, { create: true })

  return { handle, remove: () => dir.removeEntry(name).catch(() => {}) }
}

/**
 * Spills entry bytes to OPFS so the pipeline carries a file-backed blob rather
 * than the bytes themselves. Falls back to an in-memory blob whenever OPFS is
 * unavailable or refuses the write — that costs memory, never correctness.
 */
export const stageBytesInOpfs: StageBytes = async (bytes) => {
  if (!opfsSupported()) return new Blob([bytes])

  try {
    const { handle } = await createStagedFile("bin")
    const stream = await handle.createWritable()

    await stream.write(bytes)
    await stream.close()

    return handle.getFile()
  } catch (error) {
    report.warn("OPFS staging failed, keeping bytes in memory", error)

    return new Blob([bytes])
  }
}

export const openOpfsZipTarget: OpenZipTarget = async () => {
  if (!opfsSupported()) return null

  const { handle, remove } = await createStagedFile("zip")

  return {
    stream: await handle.createWritable(),
    finish: () => handle.getFile(),
    dispose: remove,
  }
}

/**
 * Drops every file the update pipeline staged in OPFS. A context that dies
 * mid-update cannot clean up after itself, so this has to be callable from
 * outside the pipeline as well.
 */
export const purgeStagedFiles = async (): Promise<void> => {
  if (!opfsSupported()) return

  try {
    const root = await navigator.storage.getDirectory()

    await root.removeEntry(STAGING_DIR, { recursive: true })

    report.info("purged staged files")
  } catch {
    report.info("nothing staged to purge")
  }
}
