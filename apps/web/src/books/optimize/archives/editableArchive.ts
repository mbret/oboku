import {
  BlobReader,
  type Entry,
  Uint8ArrayWriter,
  ZipReader,
} from "@zip.js/zip.js"
import type { Archive, ArchiveRecord } from "@oboku/archive-metadata"

/**
 * Content of a planned output entry: a pass-through original, new bytes/text, or
 * a {@link Blob} (e.g. a disk-backed spill file) whose bytes are read lazily.
 */
export type EntryContent = Entry | Uint8Array | string | Blob

export type EditableEntry = {
  dir: boolean
  content: EntryContent
  /**
   * Store the entry uncompressed and without extra header fields. EPUB OCF
   * requires this for the `mimetype` entry.
   */
  store?: boolean
}

/**
 * Ordered, mutable set of archive entries keyed by path. Insertion order is the
 * write order, so callers control entry ordering (e.g. EPUB `mimetype` first)
 * by rebuilding the map.
 */
export type EditableArchive = Map<string, EditableEntry>

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const readEntryBytes = async (
  content: EntryContent,
): Promise<Uint8Array> => {
  if (typeof content === "string") return encoder.encode(content)
  if (content instanceof Uint8Array) return content
  if (content instanceof Blob)
    return new Uint8Array(await content.arrayBuffer())
  if (content.directory) return new Uint8Array()

  return content.getData(new Uint8ArrayWriter())
}

export const readEntryText = async (content: EntryContent): Promise<string> =>
  typeof content === "string"
    ? content
    : decoder.decode(await readEntryBytes(content))

/**
 * Reads a transferable `ArrayBuffer` for the entry — exact-length and safe to
 * hand to a worker (the compression pool transfers ownership of it).
 */
export const readEntryArrayBuffer = async (
  content: EntryContent,
): Promise<ArrayBuffer> => {
  const bytes = await readEntryBytes(content)
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)

  return copy.buffer
}

const entryByteLength = (content: EntryContent): number => {
  if (typeof content === "string") return encoder.encode(content).byteLength
  if (content instanceof Uint8Array) return content.byteLength
  if (content instanceof Blob) return content.size

  return content.uncompressedSize
}

const basename = (path: string): string => {
  const slash = path.lastIndexOf("/")

  return slash === -1 ? path : path.slice(slash + 1)
}

/** Reads a zip blob into an ordered, mutable entry map. Content stays lazy. */
export const readArchive = async (
  file: Blob,
): Promise<{ entries: EditableArchive; close: () => Promise<void> }> => {
  const reader = new ZipReader(new BlobReader(file))
  const entries: EditableArchive = new Map()

  for (const entry of await reader.getEntries()) {
    entries.set(entry.filename, { dir: entry.directory, content: entry })
  }

  return { entries, close: () => reader.close() }
}

/**
 * Read-only {@link Archive} view over the entries, for the metadata
 * reader/writer and inspection. Records resolve their content lazily.
 */
export const toArchive = (
  entries: EditableArchive,
  close: () => Promise<void> = () => Promise.resolve(),
): Archive => {
  const records: ArchiveRecord[] = [...entries].map(([uri, entry]) =>
    entry.dir
      ? { dir: true, uri, basename: basename(uri) }
      : {
          dir: false,
          uri,
          basename: basename(uri),
          size: entryByteLength(entry.content),
          arrayBuffer: () => readEntryArrayBuffer(entry.content),
          blob: async () =>
            new Blob([await readEntryArrayBuffer(entry.content)]),
        },
  )

  return {
    records,
    recordsByUri: new Map(records.map((record) => [record.uri, record])),
    close,
  }
}
