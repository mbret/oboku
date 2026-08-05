import { formatBytes } from "@oboku/shared"
import { useBookOptimize } from "../BookOptimizeProvider"
import { Report, ReportRow } from "../Report"

export function ContentReport() {
  const { inspection } = useBookOptimize()
  const {
    fileSize,
    fileCount,
    imageCount,
    imageBytes,
    averageImageResolution,
  } = inspection
  const averageImageBytes = imageCount > 0 ? imageBytes / imageCount : undefined

  return (
    <Report title="Content report">
      <ReportRow label="File size" value={formatBytes(fileSize) ?? "—"} />
      <ReportRow label="Files" value={String(fileCount)} />
      <ReportRow label="Images" value={String(imageCount)} />
      {imageBytes > 0 && (
        <ReportRow
          label="Images total size"
          value={formatBytes(imageBytes) ?? "—"}
        />
      )}
      <ReportRow
        label="Average image size"
        value={formatBytes(averageImageBytes) ?? "—"}
      />
      {averageImageResolution && (
        <ReportRow
          label="Average resolution"
          value={`${averageImageResolution.width} × ${averageImageResolution.height} px`}
        />
      )}
    </Report>
  )
}
