import JSZip from "jszip"
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

const toArchiveEntry = (entry: JSZip.JSZipObject): ArchiveEntry => ({
  path: entry.name,
  isDir: entry.dir,
  readAsString: () => entry.async("string"),
  readAsUint8Array: () => entry.async("uint8array"),
})

const createJszipArchiveSource = (zip: JSZip): ArchiveSource => ({
  listEntries: async () => Object.values(zip.files).map(toArchiveEntry),
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
  const zip = await JSZip.loadAsync(file)
  const archive = createJszipArchiveSource(zip)

  Logger.info("[metadataFixer] archive structure", {
    entryCount: Object.keys(zip.files).length,
    entries: Object.values(zip.files).map((entry) => ({
      name: entry.name,
      dir: entry.dir,
      date: entry.date,
    })),
  })

  return readArchiveMetadata(archive, {
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
  const zip = await JSZip.loadAsync(file)
  const archive = createJszipArchiveSource(zip)
  const entries: ArchivePatchedEntry[] = []

  for (const { patch, targets } of patches) {
    const result = await patchArchiveMetadata(archive, patch, targets)
    entries.push(...result.entries)
  }

  for (const entry of entries) {
    zip.file(entry.path, entry.xml)
  }

  return zip.generateAsync({
    type: "blob",
    mimeType: resolvePatchedMimeType(file, patches),
  })
}
