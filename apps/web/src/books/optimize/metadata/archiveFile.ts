import JSZip from "jszip"
import {
  type Archive,
  type ArchiveMetadata,
  type ArchivePatchedEntry,
  type ArchiveMetadataTargets,
  patchArchiveMetadata,
  readArchiveMetadata,
} from "@oboku/archive-metadata"
import { createArchiveFromJszip } from "@prose-reader/streamer/archives/createArchiveFromJszip"
import { Logger } from "../../../debug/logger.shared"
import type { ArchiveMetadataPatchPlan } from "./targets"

export const loadArchive = async (
  file: Blob | File,
): Promise<{ zip: JSZip; archive: Archive }> => {
  const zip = await JSZip.loadAsync(file)
  const archive = await createArchiveFromJszip(zip)

  return { zip, archive }
}

export type { ArchiveMetadata, ArchiveMetadataTargets }

const XML_LOG_PREVIEW_BYTES = 1024

const previewXml = (xml: string): string =>
  xml.length > XML_LOG_PREVIEW_BYTES
    ? `${xml.slice(0, XML_LOG_PREVIEW_BYTES)}…`
    : xml

export const readArchiveMetadataFromSource = async (
  archive: Archive,
): Promise<ArchiveMetadata> =>
  readArchiveMetadata(archive, {
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

export const resolvePatchedMimeType = (
  file: Blob | File,
  { hasOpf }: { hasOpf: boolean },
): string => {
  if (file.type) return file.type

  if (hasOpf) return "application/epub+zip"

  return "application/x-cbz"
}

export const applyMetadataPatchesToZip = async (
  zip: JSZip,
  patches: ArchiveMetadataPatchPlan[],
): Promise<void> => {
  const archive = await createArchiveFromJszip(zip)
  const entries: ArchivePatchedEntry[] = []

  for (const { patch, targets } of patches) {
    const result = await patchArchiveMetadata(archive, patch, targets)
    entries.push(...result.entries)
  }

  for (const entry of entries) {
    zip.file(entry.path, entry.xml)
  }
}
