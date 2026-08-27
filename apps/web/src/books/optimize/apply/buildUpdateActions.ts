import type {
  ArchiveMetadataIdentifier,
  WebArchiveUpdateAction,
} from "@oboku/archive-metadata/web"
import { isIsbnBearingScheme } from "@prose-reader/archive-reader"
import type { FileInspection } from "../useFileInspection"
import { resolveMetadataTargets } from "../metadata/identifiers/containers"
import { resolveMetadataFixerFormValues } from "../metadata/identifiers/resolveMetadataFixerFormValues"
import {
  hasImageCompressionOperation,
  parseDimension,
  type BookOptimizeFormValues,
} from "../form"

const normalizeFormIsbn = (isbn: string): string | undefined => {
  const trimmed = isbn.trim()

  return trimmed === "" ? undefined : trimmed
}

const announcesIsbn = ({ scheme }: ArchiveMetadataIdentifier): boolean =>
  isIsbnBearingScheme(scheme)

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

const resolveMetadataPatchAction = (
  values: BookOptimizeFormValues,
  inspection: FileInspection,
): WebArchiveUpdateAction | undefined => {
  const targets = resolveMetadataTargets(inspection)

  if (targets.comicInfo !== true && targets.opf !== true) return undefined

  const isbn = normalizeFormIsbn(values.isbn)

  if (isbn === resolveMetadataFixerFormValues(inspection).isbn) return undefined

  return {
    kind: "patch-metadata",
    patch: { identifiers: patchIdentifiers(inspection, isbn) },
    targets,
  }
}

const resolveCompressImagesAction = (
  values: BookOptimizeFormValues,
): WebArchiveUpdateAction | undefined => {
  if (!values.compressImages || !hasImageCompressionOperation(values))
    return undefined

  return {
    kind: "compress-images",
    config: {
      maxWidth: parseDimension(values.maxWidth),
      maxHeight: parseDimension(values.maxHeight),
      outputMode: values.imageOutputMode,
    },
  }
}

export const buildUpdateActions = (
  values: BookOptimizeFormValues,
  inspection: FileInspection,
): WebArchiveUpdateAction[] =>
  [
    resolveMetadataPatchAction(values, inspection),
    resolveCompressImagesAction(values),
  ].filter((action): action is WebArchiveUpdateAction => action !== undefined)
