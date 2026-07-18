import {
  BlobReader,
  BlobWriter,
  type Entry,
  TextReader,
  ZipReader,
  ZipWriter,
} from "@zip.js/zip.js"
import {
  type Archive,
  type ArchiveMetadata,
  type ArchivePatchedEntry,
  type ArchiveMetadataTargets,
  patchArchiveMetadata,
  readArchiveMetadata,
} from "@oboku/archive-metadata"
import {
  blobFileAccessors,
  createArchiveFromEntries,
} from "@prose-reader/archive-reader"
import { createArchiveFromZipJs } from "@prose-reader/archive-reader/archives/createArchiveFromZipJs"
import { Logger } from "../../../debug/logger.shared"
import type { ArchiveMetadataPatchPlan } from "./targets"

const createZipJsArchiveFromEntries = (entries: Entry[]): Archive =>
  createArchiveFromEntries(
    entries,
    (entry) =>
      entry.directory
        ? { dir: true, uri: entry.filename }
        : {
            dir: false,
            uri: entry.filename,
            size: entry.uncompressedSize,
            ...blobFileAccessors(() => entry.getData(new BlobWriter())),
          },
    { close: () => Promise.resolve() },
  )

export type { ArchiveMetadata, ArchiveMetadataTargets }

const XML_LOG_PREVIEW_BYTES = 1024

const previewXml = (xml: string): string =>
  xml.length > XML_LOG_PREVIEW_BYTES
    ? `${xml.slice(0, XML_LOG_PREVIEW_BYTES)}…`
    : xml

export const readArchiveMetadataFromFile = async (
  file: Blob | File,
): Promise<ArchiveMetadata> => {
  const zipReader = new ZipReader(new BlobReader(file))

  try {
    const archive = await createArchiveFromZipJs(zipReader)

    Logger.info("[metadataFixer] archive structure", {
      entryCount: archive.records.length,
      entries: archive.records.map((record) => ({
        name: record.uri,
        dir: record.dir,
      })),
    })

    return await readArchiveMetadata(archive, {
      onOpfRead: ({ path, xml }) => {
        Logger.info("[metadataFixer] OPF read", {
          path,
          length: xml.length,
          preview: previewXml(xml),
        })
      },
      onComicInfoRead: ({ path, xml }) => {
        Logger.info("[metadataFixer] ComicInfo.xml read", {
          path,
          length: xml.length,
          preview: previewXml(xml),
        })
      },
    })
  } finally {
    await zipReader.close()
  }
}

const resolvePatchedMimeType = (
  file: Blob | File,
  patches: ArchiveMetadataPatchPlan[],
): string => {
  if (file.type) return file.type

  if (patches.some(({ targets }) => targets.opf)) return "application/epub+zip"

  return "application/x-cbz"
}

export const patchArchiveFile = async (
  file: Blob | File,
  patches: ArchiveMetadataPatchPlan[],
): Promise<Blob> => {
  const zipReader = new ZipReader(new BlobReader(file))

  try {
    const originalEntries = await zipReader.getEntries()
    const archive = createZipJsArchiveFromEntries(originalEntries)
    const patchedEntries: ArchivePatchedEntry[] = []

    for (const { patch, targets } of patches) {
      const result = await patchArchiveMetadata(archive, patch, targets)
      patchedEntries.push(...result.entries)
    }

    const patchedByPath = new Map(
      patchedEntries.map((entry) => [entry.path, entry.xml]),
    )

    // EPUB OCF requires the `mimetype` entry to be first, stored uncompressed,
    // and free of extra fields. Storing every entry (level 0, no data
    // descriptor, no extended timestamp) preserves the original (preserved)
    // entry order and keeps that guarantee, matching jszip's prior STORE output.
    const zipWriter = new ZipWriter(
      new BlobWriter(resolvePatchedMimeType(file, patches)),
      { level: 0, dataDescriptor: false, extendedTimestamp: false },
    )

    for (const entry of originalEntries) {
      if (entry.directory) {
        await zipWriter.add(entry.filename, undefined, { directory: true })
        continue
      }

      const patchedXml = patchedByPath.get(entry.filename)

      if (patchedXml !== undefined) {
        patchedByPath.delete(entry.filename)
        await zipWriter.add(entry.filename, new TextReader(patchedXml))
        continue
      }

      const data = await entry.getData(new BlobWriter())
      await zipWriter.add(entry.filename, new BlobReader(data))
    }

    for (const [path, xml] of patchedByPath) {
      await zipWriter.add(path, new TextReader(xml))
    }

    return await zipWriter.close()
  } finally {
    await zipReader.close()
  }
}
