import { memo } from "react"
import { useBookOptimize } from "../BookOptimizeProvider"
import { Report, ReportRow } from "../Report"
import type { ContainerState } from "../useFileInspection"
import { CONTAINER_LABELS } from "./targets"

const CONTAINER_STATE_LABELS: Record<ContainerState, string> = {
  absent: "Not found",
  readable: "Found",
  unreadable: "Found, unreadable",
}

export const MetadataReport = memo(function MetadataReport() {
  const { inspection } = useBookOptimize()
  const { comicInfo, opf, isbn } = inspection

  return (
    <Report title="Metadata report">
      <ReportRow
        label={CONTAINER_LABELS.comicInfo}
        value={CONTAINER_STATE_LABELS[comicInfo]}
      />
      <ReportRow
        label={CONTAINER_LABELS.opf}
        value={CONTAINER_STATE_LABELS[opf]}
      />
      <ReportRow label="ISBN" value={isbn ?? "—"} />
    </Report>
  )
})
