import type {
  ArchiveMetadataPatch,
  ArchiveMetadataTargets,
} from "@oboku/archive-metadata/web"
import { identifierValue } from "@prose-reader/archive-reader"
import type { FileInspection } from "../useFileInspection"
import type { MetadataFixerFormValues } from "./types"

export type ContainerKey = "comicInfo" | "opf"

export type ArchiveMetadataPatchPlan = {
  patch: ArchiveMetadataPatch
  targets: ArchiveMetadataTargets
}

export const CONTAINER_LABELS: Record<ContainerKey, string> = {
  comicInfo: "ComicInfo.xml",
  opf: "OPF package document",
}

export const EMPTY_METADATA_FIXER_FORM_VALUES: MetadataFixerFormValues = {
  isbn: "",
}

const normalizeFormIsbn = (isbn: string): string | undefined => {
  const trimmed = isbn.trim()

  return trimmed === "" ? undefined : trimmed
}

export const trimMetadataFixerFormValues = ({
  isbn,
}: MetadataFixerFormValues): MetadataFixerFormValues => ({
  isbn: isbn.trim(),
})

export const resolveMetadataFixerFormValues = (
  inspection: FileInspection,
): MetadataFixerFormValues => ({
  isbn:
    identifierValue(inspection.resolvedArchive.metadata.identifiers, "ISBN") ??
    "",
})

/**
 * The containers a save should write. Every container the book already carries
 * is written, so they cannot end up disagreeing about the same ISBN — picking a
 * winner per container was never the user's call.
 *
 * ComicInfo.xml is only ever created for an archive that carries no metadata of
 * its own: a bare comic archive. A book that carries a package document is an
 * EPUB and is never given one, whether or not that document turns out to be
 * readable — ComicInfo describes a comic archive, and a broken OPF does not
 * make a book into one.
 *
 * An unreadable OPF is skipped rather than replaced: the package document also
 * carries the manifest and spine, so overwriting it with the fields oboku knows
 * about would cost the book its reading order. An EPUB whose OPF cannot be
 * parsed therefore has nowhere to record anything, which
 * {@link hasWritableMetadataTarget} lets callers say out loud.
 */
export const resolveMetadataTargets = ({
  resolvedArchive,
}: FileInspection): ArchiveMetadataTargets => {
  const { sources, unreadableSources } = resolvedArchive
  const carriesComicInfo =
    sources.comicInfo !== undefined || unreadableSources.includes("comicInfo")
  const carriesOpf =
    sources.opf !== undefined || unreadableSources.includes("opf")

  return {
    comicInfo: carriesComicInfo || !carriesOpf,
    opf: sources.opf !== undefined,
  }
}

/** Whether a save has any container left to write the metadata into. */
export const hasWritableMetadataTarget = (
  inspection: FileInspection,
): boolean => {
  const { comicInfo, opf } = resolveMetadataTargets(inspection)

  return comicInfo === true || opf === true
}

export const resolveArchiveMetadataPatchPlan = (
  values: MetadataFixerFormValues,
  inspection: FileInspection,
): ArchiveMetadataPatchPlan => ({
  patch: { isbn: normalizeFormIsbn(values.isbn) },
  targets: resolveMetadataTargets(inspection),
})
