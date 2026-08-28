import type {
  ArchiveMetadataIdentifier,
  ArchiveMetadataPatch,
  WebArchiveUpdateAction,
} from "@oboku/archive-metadata/web"
import { groupBy } from "@oboku/shared"
import type { FileInspection } from "../useFileInspection"
import type {
  MetadataFixerFormValues,
  MetadataIdentifierFormValue,
} from "../metadata/formValues"
import { canonicalIdentifier } from "../metadata/identifiers/canonicalIdentifier"
import { resolveMetadataTargets } from "../metadata/identifiers/containers"
import {
  identifierRowKey,
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
 * The identifiers the edit no longer stands for, keyed as rows.
 *
 * Each scheme's seeded rows are matched against the edited ones as a multiset:
 * the values still present pair up first, whatever is left of each side pairs
 * up in order, and a seeded row the edited list has none left to stand for is
 * dropped. Pairing an edited row with a seeded row of its scheme rather than
 * its value is what makes editing a value an edit: the row still stands for
 * the identifier it was seeded from, so its element keeps its `id` and the
 * refinements pointing at it instead of being deleted and rebuilt.
 */
const droppedIdentifierRowKeys = (
  seeded: ReadonlyArray<MetadataIdentifierFormValue>,
  edited: ReadonlyArray<MetadataIdentifierFormValue>,
): Set<string> => {
  const editedBySchemeGroup = groupBy(edited, identifierRowScheme)
  const dropped = new Set<string>()

  for (const [scheme, seededGroup] of Object.entries(
    groupBy(seeded, identifierRowScheme),
  )) {
    const unpairedEdited = [...(editedBySchemeGroup[scheme] ?? [])]
    const unpairedSeeded: MetadataIdentifierFormValue[] = []

    for (const identifier of seededGroup) {
      const paired = unpairedEdited.findIndex(function hasSameValue({ value }) {
        return value === identifier.value
      })

      if (paired === -1) unpairedSeeded.push(identifier)
      else unpairedEdited.splice(paired, 1)
    }

    for (const surplus of unpairedSeeded.slice(unpairedEdited.length)) {
      dropped.add(identifierRowKey(surplus))
    }
  }

  return dropped
}

/**
 * What the archive should carry after the edit, and what the edit dropped.
 *
 * The rows the form was seeded with are the baseline, and one is dropped when
 * {@link droppedIdentifierRowKeys} finds the edited list has no row left to
 * stand for it. Dropping a row names every identifier the reader reported for
 * it, so the one row an ISBN and the `GTIN` of the same value collapse into
 * takes both containers' copies with it.
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
  seeded: ReadonlyArray<MetadataIdentifierFormValue>,
  edited: ReadonlyArray<MetadataIdentifierFormValue>,
): Pick<ArchiveMetadataPatch, "identifiers" | "removedIdentifiers"> => {
  const dropped = droppedIdentifierRowKeys(seeded, edited)
  const removedIdentifiers = (
    inspection.resolvedArchive.metadata.identifiers ?? []
  ).flatMap(function whenNoRowStandsForIt(resolved) {
    return dropped.has(identifierRowKey(toIdentifierRow(resolved)))
      ? [{ scheme: resolved.scheme, value: resolved.value }]
      : []
  })

  return { identifiers: edited.map(toPatchIdentifier), removedIdentifiers }
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
    patch: identifierPatch(inspection, resolved.identifiers, identifiers),
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
