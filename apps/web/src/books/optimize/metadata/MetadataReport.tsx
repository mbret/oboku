import {
  identifierValue,
  type ResolvedArchiveSourceKind,
} from "@prose-reader/archive-reader"
import { memo } from "react"
import { useBookOptimize } from "../BookOptimizeProvider"
import { Report, ReportRow } from "../Report"
import type { ResolvedBookArchive } from "../useFileInspection"
import { CONTAINER_LABELS } from "./targets"

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
      <ReportRow
        label="ISBN"
        value={
          identifierValue(resolvedArchive.metadata.identifiers, "ISBN") ?? "—"
        }
      />
    </Report>
  )
})
