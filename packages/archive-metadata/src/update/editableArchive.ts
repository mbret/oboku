import {
  arrayBufferFileAccessors,
  createArchiveFromEntries,
} from "@prose-reader/archive-reader"
import type { Archive, ArchiveFileRecord } from "../archive/types"

/**
 * Content of a planned output entry: a pass-through record from the source
 * archive, new bytes/text, or a {@link Blob} (e.g. a disk-backed spill file)
 * whose bytes are read lazily.
 */
export type EntryContent = ArchiveFileRecord | Uint8Array | string | Blob

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

const EMPTY_BYTES = new Uint8Array()

export const readEntryBytes = async (
  content: EntryContent,
): Promise<Uint8Array> => {
  if (typeof content === "string") return encoder.encode(content)
  if (content instanceof Uint8Array) return content

  return new Uint8Array(await content.arrayBuffer())
}

export const readEntryText = async (content: EntryContent): Promise<string> =>
  typeof content === "string"
    ? content
    : decoder.decode(await readEntryBytes(content))

/**
 * Reads an exact-length `ArrayBuffer` for the entry, detached from whatever
 * buffer the bytes came from so the caller owns it outright.
 */
const readEntryArrayBuffer = async (
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

  return content.size
}

/**
 * Ordered, mutable view over a source archive's records. Content stays lazy:
 * pass-through entries are only read when the output archive is written.
 */
export const toEditableArchive = (archive: Archive): EditableArchive =>
  new Map(
    archive.records.map((record) => [
      record.uri,
      record.dir
        ? { dir: true, content: EMPTY_BYTES }
        : { dir: false, content: record },
    ]),
  )

/**
 * Read-only {@link Archive} view over the entries, so the metadata reader and
 * writer can run against work in progress. Records resolve content lazily.
 */
export const toArchive = (
  entries: EditableArchive,
  close: () => Promise<void> = () => Promise.resolve(),
): Archive =>
  createArchiveFromEntries(
    [...entries],
    ([uri, entry]) =>
      entry.dir
        ? { dir: true, uri }
        : {
            dir: false,
            uri,
            size: entryByteLength(entry.content),
            ...arrayBufferFileAccessors(() =>
              readEntryArrayBuffer(entry.content),
            ),
          },
    { close },
  )
