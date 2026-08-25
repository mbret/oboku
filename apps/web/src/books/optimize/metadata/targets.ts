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
 * Writes the ISBN into every container the archive can carry: the OPF when it
 * is readable, plus ComicInfo.xml either patched or synthesized. Keeping them
 * in sync is the point — an archive whose containers disagree has no ISBN the
 * user can trust, and picking a winner per container was never their call.
 *
 * An unreadable OPF is skipped rather than replaced: the package document
 * also carries the manifest and spine, so overwriting it with the fields
 * oboku knows about would cost the book its reading order.
 */
export const resolveArchiveMetadataPatchPlan = (
  values: MetadataFixerFormValues,
  inspection: FileInspection,
): ArchiveMetadataPatchPlan => ({
  patch: { isbn: normalizeFormIsbn(values.isbn) },
  targets: {
    comicInfo: true,
    opf: inspection.resolvedArchive.sources.opf !== undefined,
  },
})
