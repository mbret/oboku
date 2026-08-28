import type { ArchiveMetadataTargets } from "@oboku/archive-metadata/web"
import type { FileInspection } from "../../useFileInspection"

type ContainerKey = "comicInfo" | "opf"

export const CONTAINER_LABELS: Record<ContainerKey, string> = {
  comicInfo: "ComicInfo.xml",
  opf: "OPF package document",
}

/**
 * The containers a save should write.
 *
 * A container the book carries but oboku cannot parse stops the save: it
 * cannot be patched without being read, and replacing it would discard
 * whatever it holds that oboku does not model. Falling back to the other
 * container is not a fix either — a book with a package document is an EPUB
 * whether or not that document parses, and a comic sidecar does not belong in
 * one.
 *
 * Otherwise every container the book already carries is written, so they cannot
 * end up disagreeing about the same ISBN — picking a winner per container was
 * never the user's call. ComicInfo.xml is created only for an archive that
 * carries no metadata of its own: a bare comic archive.
 */
export const resolveMetadataTargets = ({
  resolvedArchive,
}: FileInspection): ArchiveMetadataTargets => {
  const { sources, unreadableSources } = resolvedArchive

  if (
    unreadableSources.includes("opf") ||
    unreadableSources.includes("comicInfo")
  ) {
    return { comicInfo: false, opf: false }
  }

  const opf = sources.opf !== undefined

  return { comicInfo: sources.comicInfo !== undefined || !opf, opf }
}

/** Whether a save has any container left to write the metadata into. */
export const hasWritableMetadataTarget = (
  inspection: FileInspection,
): boolean => {
  const { comicInfo, opf } = resolveMetadataTargets(inspection)

  return comicInfo === true || opf === true
}
