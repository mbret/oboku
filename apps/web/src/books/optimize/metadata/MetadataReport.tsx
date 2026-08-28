import type { ResolvedArchiveSourceKind } from "@prose-reader/archive-reader"
import { memo } from "react"
import { useBookOptimize } from "../BookOptimizeProvider"
import { Report, ReportRow } from "../Report"
import type { ResolvedBookArchive } from "../useFileInspection"
import { CONTAINER_LABELS } from "./identifiers/containers"
import { resolveMetadataFixerFormValues } from "./identifiers/resolveMetadataFixerFormValues"
import { identifierSchemeLabel } from "./identifiers/schemes"

const containerValue = (
  kind: ResolvedArchiveSourceKind,
  { sources, unreadableSources }: ResolvedBookArchive,
): string => {
  if (sources[kind] !== undefined) return "Found"

  return unreadableSources.includes(kind) ? "Found, unreadable" : "Not found"
}

export const MetadataReport = memo(function MetadataReport() {
  const { inspection } = useBookOptimize()
  const { resolvedArchive } = inspection
  const { identifiers } = resolveMetadataFixerFormValues(inspection)

  return (
    <Report title="Metadata report">
      <ReportRow
        label={CONTAINER_LABELS.comicInfo}
        value={containerValue("comicInfo", resolvedArchive)}
      />
      <ReportRow
        label={CONTAINER_LABELS.opf}
        value={containerValue("opf", resolvedArchive)}
      />
      {identifiers.length === 0 ? (
        <ReportRow label="Identifiers" value="—" />
      ) : (
        identifiers.map(function renderIdentifier({ scheme, value }) {
          return (
            <ReportRow
              key={`${scheme}:${value}`}
              label={identifierSchemeLabel(scheme)}
              value={value}
            />
          )
        })
      )}
    </Report>
  )
})
