import { formatBytes } from "@oboku/shared"
import { useBookOptimize } from "../BookOptimizeProvider"
import { Report, ReportRow } from "../Report"

export function ContentReport() {
  const { inspection } = useBookOptimize()
  const { fileSize, imageCount, imageBytes, averageImageResolution } =
    inspection

  return (
    <Report title="Content report">
      <ReportRow label="File size" value={formatBytes(fileSize) ?? "—"} />
      <ReportRow label="Images" value={String(imageCount)} />
      {imageBytes > 0 && (
        <ReportRow
          label="Images total size"
          value={formatBytes(imageBytes) ?? "—"}
        />
      )}
      {averageImageResolution && (
        <ReportRow
          label="Average resolution"
          value={`${averageImageResolution.width} × ${averageImageResolution.height} px`}
        />
      )}
    </Report>
  )
}
