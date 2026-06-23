import {
  type Archive,
  type ArchiveMetadata,
  type ArchivePatchedEntry,
  type ArchiveMetadataTargets,
  patchArchiveMetadata,
  readArchiveMetadata,
} from "@oboku/archive-metadata"
import { Logger } from "../../../debug/logger.shared"
import { type EditableArchive, toArchive } from "../archives/editableArchive"
import type { ArchiveMetadataPatchPlan } from "./targets"

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

/** Applies metadata patches in place by replacing the affected entries. */
export const applyMetadataPatches = async (
  entries: EditableArchive,
  patches: ArchiveMetadataPatchPlan[],
): Promise<void> => {
  const archive = toArchive(entries)
  const patched: ArchivePatchedEntry[] = []

  for (const { patch, targets } of patches) {
    const result = await patchArchiveMetadata(archive, patch, targets)
    patched.push(...result.entries)
  }

  for (const entry of patched) {
    entries.set(entry.path, { dir: false, content: entry.xml })
  }
}
