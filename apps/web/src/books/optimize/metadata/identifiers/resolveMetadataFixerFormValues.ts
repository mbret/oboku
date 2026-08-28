import {
  isIsbnBearingScheme,
  normalizeIdentifierScheme,
  type ResolvedMetadataIdentifier,
} from "@prose-reader/archive-reader"
import type { FileInspection } from "../../useFileInspection"
import type {
  MetadataFixerFormValues,
  MetadataIdentifierFormValue,
} from "../formValues"
import { canonicalIdentifier, catalogIdentifier } from "./canonicalIdentifier"

/**
 * The scheme a row is keyed under, collapsing the ones that mean the same: an
 * ISBN and a `GTIN` of the same value are the one identifier each container
 * spells its own way.
 */
export const identifierRowScheme = ({
  scheme,
}: MetadataIdentifierFormValue): string =>
  isIsbnBearingScheme(scheme) ? "isbn-bearing" : scheme

/**
 * The identifier a row stands for, whichever container spelled it.
 *
 * The reader reports each container's identifiers as it finds them, so one
 * identifier written to both comes back twice under whichever scheme each
 * container has a slot for: an ISBN as `ISBN` from the OPF and `GTIN` from
 * ComicInfo. Collapsing those keeps a saved book from growing a duplicate row
 * every time it is inspected again.
 */
export const identifierRowKey = (
  identifier: MetadataIdentifierFormValue,
): string => `${identifierRowScheme(identifier)}:${identifier.value}`

/**
 * The row an identifier the reader reported belongs to, so a caller can ask
 * whether the edited list still represents it.
 */
export const toIdentifierRow = (
  identifier: ResolvedMetadataIdentifier,
): MetadataIdentifierFormValue => {
  const { scheme, value } = canonicalIdentifier(
    catalogIdentifier(identifier) ?? identifier,
  )

  return {
    scheme: normalizeIdentifierScheme(scheme),
    value,
    unique: identifier.unique === true,
  }
}

export const resolveMetadataFixerFormValues = (
  inspection: FileInspection,
): MetadataFixerFormValues => {
  const seen = new Set<string>()
  const identifiers: MetadataIdentifierFormValue[] = []

  for (const resolved of inspection.resolvedArchive.metadata.identifiers ??
    []) {
    const identifier = toIdentifierRow(resolved)
    const key = identifierRowKey(identifier)

    if (seen.has(key)) continue

    seen.add(key)
    identifiers.push(identifier)
  }

  return { identifiers }
}
