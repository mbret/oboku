import type {
  ArchiveMetadataIdentifier,
  ArchiveMetadataPatch,
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
 * What the archive should carry after the edit, and what the edit dropped.
 *
 * The archive's own identifiers are the baseline, so the difference between
 * them and the edited set is exactly what the user removed — which is the only
 * thing the writer is asked to delete. An identifier neither list names is left
 * alone, including ones the reader never reported and no one here could know
 * about.
 *
 * An ISBN is usually announced more than once: a book whose OPF and ComicInfo
 * both carry it is read as an `ISBN` and a `GTIN` of the same value. They are
 * one fact, so the edit lands on the first and the rest are dropped.
 */
const identifierPatch = (
  inspection: FileInspection,
  isbn: string | undefined,
): Pick<ArchiveMetadataPatch, "identifiers" | "removedIdentifiers"> => {
  const announced = (inspection.resolvedArchive.metadata.identifiers ?? []).map(
    function toPatchIdentifier({ scheme, value, unique }) {
      return { scheme, value, unique: unique === true }
    },
  )
  const editedIndex = announced.findIndex(announcesIsbn)

  const identifiers = announced.flatMap(
    function keepOrReplace(identifier, index) {
      if (!announcesIsbn(identifier)) return [identifier]
      if (index !== editedIndex || isbn === undefined) return []

      return [{ ...identifier, value: isbn }]
    },
  )

  const removedIdentifiers = announced.filter(
    function wasDropped(identifier, index) {
      return (
        announcesIsbn(identifier) &&
        (index !== editedIndex || isbn === undefined)
      )
    },
  )

  return {
    identifiers:
      editedIndex === -1 && isbn !== undefined
        ? [...identifiers, { scheme: "ISBN", value: isbn }]
        : identifiers,
    removedIdentifiers,
  }
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
    patch: identifierPatch(inspection, isbn),
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
