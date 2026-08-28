import type {
  ArchiveMetadataIdentifier,
  ArchiveMetadataPatch,
  WebArchiveUpdateAction,
} from "@oboku/archive-metadata/web"
import type { FileInspection } from "../useFileInspection"
import type {
  MetadataFixerFormValues,
  MetadataIdentifierFormValue,
} from "../metadata/formValues"
import { canonicalIdentifier } from "../metadata/identifiers/canonicalIdentifier"
import { resolveMetadataTargets } from "../metadata/identifiers/containers"
import {
  identifierRowScheme,
  resolveMetadataFixerFormValues,
  toIdentifierRow,
} from "../metadata/identifiers/resolveMetadataFixerFormValues"
import {
  hasImageCompressionOperation,
  parseDimension,
  type BookOptimizeFormValues,
} from "../form"

const trimIdentifiers = ({
  identifiers,
}: MetadataFixerFormValues): MetadataIdentifierFormValue[] =>
  identifiers.map(function trimIdentifier({ scheme, value, unique }) {
    return { scheme: scheme.trim(), value: value.trim(), unique }
  })

const haveIdentifiersChanged = (
  left: ReadonlyArray<MetadataIdentifierFormValue>,
  right: ReadonlyArray<MetadataIdentifierFormValue>,
): boolean =>
  left.length !== right.length ||
  left.some(function differsFromCounterpart(identifier, index) {
    const other = right[index]

    return (
      identifier.scheme !== other?.scheme || identifier.value !== other?.value
    )
  })

const toPatchIdentifier = ({
  scheme,
  value,
  unique,
}: MetadataIdentifierFormValue): ArchiveMetadataIdentifier => ({
  ...canonicalIdentifier({ scheme, value }),
  unique,
})

/**
 * What the archive should carry after the edit, and what the edit dropped.
 *
 * The archive's own identifiers are the baseline, and one is dropped when the
 * edited list has no row on its scheme any more. Matching on the scheme rather
 * than the value is what makes editing a value an edit: the row still stands
 * for the identifier it was seeded from, so its element keeps its `id` and the
 * refinements pointing at it instead of being deleted and rebuilt. It also
 * keeps the one row an ISBN and the `GTIN` of the same value collapse into from
 * dropping either of them.
 *
 * Nothing else is named, so an identifier the reader never reported — which no
 * row could stand for and no one here knows about — is left alone.
 *
 * The identifiers go to every container the archive can carry. Keeping them in
 * sync is the point — an archive whose containers disagree has no identifier
 * the user can trust, and picking a winner per container was never their call.
 */
const identifierPatch = (
  inspection: FileInspection,
  rows: ReadonlyArray<MetadataIdentifierFormValue>,
): Pick<ArchiveMetadataPatch, "identifiers" | "removedIdentifiers"> => {
  const kept = new Set(rows.map(identifierRowScheme))
  const removedIdentifiers = (
    inspection.resolvedArchive.metadata.identifiers ?? []
  ).flatMap(function whenNoRowStandsForIt(resolved) {
    return kept.has(identifierRowScheme(toIdentifierRow(resolved)))
      ? []
      : [{ scheme: resolved.scheme, value: resolved.value }]
  })

  return { identifiers: rows.map(toPatchIdentifier), removedIdentifiers }
}

const resolveMetadataPatchAction = (
  values: BookOptimizeFormValues,
  inspection: FileInspection,
): WebArchiveUpdateAction | undefined => {
  const targets = resolveMetadataTargets(inspection)

  if (targets.comicInfo !== true && targets.opf !== true) return undefined

  const identifiers = trimIdentifiers(values)
  const resolved = resolveMetadataFixerFormValues(inspection)

  if (!haveIdentifiersChanged(identifiers, resolved.identifiers))
    return undefined

  return {
    kind: "patch-metadata",
    patch: identifierPatch(inspection, identifiers),
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
