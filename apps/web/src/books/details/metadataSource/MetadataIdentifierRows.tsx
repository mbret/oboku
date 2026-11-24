import type { MetadataIdentifier } from "@prose-reader/archive-reader"
import { identifierSchemeLabel } from "../../optimize/metadata/identifiers/schemes"
import { MetadataFieldRow } from "./MetadataFieldRow"

type Props = {
  identifiers: ReadonlyArray<MetadataIdentifier>
}

/** One row per identifier a source states, labelled with its scheme. */
export const MetadataIdentifierRows = ({ identifiers }: Props) => {
  if (identifiers.length === 0) {
    return <MetadataFieldRow label="Identifiers" value={undefined} />
  }

  return identifiers.map(function renderIdentifierRow(
    { scheme, value },
    index,
  ) {
    return (
      <MetadataFieldRow
        key={index}
        label={identifierSchemeLabel(scheme)}
        value={value}
      />
    )
  })
}
