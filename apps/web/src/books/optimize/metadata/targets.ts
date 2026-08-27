import type {
  ArchiveMetadataIdentifier,
  ArchiveMetadataPatch,
  ArchiveMetadataTargets,
} from "@oboku/archive-metadata/web"
import {
  identifierValue,
  isIsbnBearingScheme,
} from "@prose-reader/archive-reader"
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
 * The identifiers the archive should end up carrying: the ones it already has,
 * with the edited ISBN in place of every one of them that announced an ISBN.
 *
 * More than one usually does — a book whose OPF and ComicInfo both carry it is
 * read as an `ISBN` and a `GTIN` of the same value — and they are one fact, so
 * the edit replaces the first and drops the rest. Keeping the others would
 * leave the previous ISBN behind under the other scheme.
 *
 * The patch is the complete set rather than a delta, so every identifier the
 * book carries has to be listed for it to survive the write. Only the ISBN is
 * editable here; the rest are passed through as read.
 */
const announcesIsbn = ({ scheme }: ArchiveMetadataIdentifier): boolean =>
  isIsbnBearingScheme(scheme)

const patchIdentifiers = (
  inspection: FileInspection,
  isbn: string | undefined,
): ArchiveMetadataIdentifier[] => {
  const identifiers = (
    inspection.resolvedArchive.metadata.identifiers ?? []
  ).map(function toPatchIdentifier({ scheme, value, unique }) {
    return { scheme, value, unique: unique === true }
  })
  const editedIndex = identifiers.findIndex(announcesIsbn)

  const carried = identifiers.flatMap(
    function keepOrReplace(identifier, index) {
      if (!announcesIsbn(identifier)) return [identifier]
      if (index !== editedIndex || isbn === undefined) return []

      return [{ ...identifier, value: isbn }]
    },
  )

  return editedIndex === -1 && isbn !== undefined
    ? [...carried, { scheme: "ISBN", value: isbn }]
    : carried
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

export const resolveArchiveMetadataPatchPlan = (
  values: MetadataFixerFormValues,
  inspection: FileInspection,
): ArchiveMetadataPatchPlan => ({
  patch: {
    identifiers: patchIdentifiers(inspection, normalizeFormIsbn(values.isbn)),
  },
  targets: resolveMetadataTargets(inspection),
})
