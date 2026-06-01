import {
  BlobReader,
  BlobWriter,
  type Entry,
  TextReader,
  TextWriter,
  Uint8ArrayWriter,
  ZipReader,
  ZipWriter,
} from "@zip.js/zip.js"
import {
  type ArchiveEntry,
  type ArchiveMetadata,
  type ArchivePatchedEntry,
  type ArchiveMetadataTargets,
  type ArchiveSource,
  patchArchiveMetadata,
  readArchiveMetadata,
} from "@oboku/archive-metadata"
import { Logger } from "../../../debug/logger.shared"
import type { ArchiveMetadataPatchPlan } from "./targets"

const toArchiveEntry = (entry: Entry): ArchiveEntry => ({
  path: entry.filename,
  isDir: entry.directory,
  readAsString: () =>
    entry.directory ? Promise.resolve("") : entry.getData(new TextWriter()),
  readAsUint8Array: () =>
    entry.directory
      ? Promise.resolve(new Uint8Array())
      : entry.getData(new Uint8ArrayWriter()),
})

const createZipJsArchiveSource = (entries: Entry[]): ArchiveSource => ({
  listEntries: async () => entries.map(toArchiveEntry),
})

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
    const entries = await zipReader.getEntries()
    const archive = createZipJsArchiveSource(entries)

    Logger.info("[metadataFixer] archive structure", {
      entryCount: entries.length,
      entries: entries.map((entry) => ({
        name: entry.filename,
        dir: entry.directory,
        date: entry.lastModDate,
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
    const archive = createZipJsArchiveSource(originalEntries)
    const patchedEntries: ArchivePatchedEntry[] = []

    for (const { patch, targets } of patches) {
      const result = await patchArchiveMetadata(archive, patch, targets)
      patchedEntries.push(...result.entries)
    }

    const patchedByPath = new Map(
      patchedEntries.map((entry) => [entry.path, entry.xml]),
    )

    const zipWriter = new ZipWriter(
      new BlobWriter(resolvePatchedMimeType(file, patches)),
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
