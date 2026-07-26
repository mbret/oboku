import { BlobWriter, Uint8ArrayReader, ZipWriter } from "@zip.js/zip.js"
import { report } from "../utils/report"
import { type EditableArchive, readEntryBytes } from "./editableArchive"
import type { OpenZipTarget, ZipTarget } from "./staging"

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
  dispose: () => Promise<void>
}

const writeZipToTarget = async (
  entries: EditableArchive,
  target: ZipTarget,
): Promise<WrittenArchive> => {
  try {
    const writer = new ZipWriter(target.stream)

    await addEntriesToZip(writer, entries)
    await writer.close()

    const blob = await target.finish()

    report.info("streamed archive", { bytes: blob.size })

    return { blob, dispose: target.dispose }
  } catch (error) {
    await target.dispose().catch(() => {})

    throw error
  }
}

const writeZipToBlob = async (
  entries: EditableArchive,
): Promise<WrittenArchive> => {
  const writer = new ZipWriter(new BlobWriter())

  await addEntriesToZip(writer, entries)

  const blob = await writer.close()

  report.info("wrote in-memory archive", { bytes: blob.size })

  return { blob, dispose: () => Promise.resolve() }
}

/**
 * Assembles the entries into a zip, streaming into `openZipTarget` so the output
 * never has to be held in memory. Only runtimes that have no streaming
 * destination at all — they return `null` — build the archive in memory; a
 * destination that fails mid-write fails the write rather than quietly falling
 * back to holding the whole archive.
 */
export const writeZip = async (
  entries: EditableArchive,
  { openZipTarget }: { openZipTarget: OpenZipTarget },
): Promise<WrittenArchive> => {
  const target = await openZipTarget()

  return target ? writeZipToTarget(entries, target) : writeZipToBlob(entries)
}
