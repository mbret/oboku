import { formatBytes } from "@oboku/shared"
import { Chip, Divider, Stack, Typography, styled } from "@mui/material"
import { useBookOptimize } from "../BookOptimizeProvider"
import { Report, ReportRow } from "../Report"

const FileFormatsSectionStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(0.75),
}))

const FileFormatChipsStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: theme.spacing(0.5),
}))

const formatResolution = ({
  width,
  height,
}: {
  width: number
  height: number
}): string => `${width} × ${height} px (${(width / height).toFixed(2)}:1)`

export function ContentReport() {
  const { inspection } = useBookOptimize()
  const {
    fileSize,
    fileCount,
    fileExtensions,
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
          value={formatResolution(averageImageResolution)}
        />
      )}
      <Divider />
      <FileFormatsSectionStack>
        <Typography variant="body2" color="text.secondary">
          File formats
        </Typography>
        <FileFormatChipsStack>
          {fileExtensions.length > 0 ? (
            fileExtensions.map(function renderFileExtension(extension) {
              return (
                <Chip
                  key={extension}
                  label={extension}
                  size="small"
                  variant="outlined"
                />
              )
            })
          ) : (
            <Typography variant="body2">—</Typography>
          )}
        </FileFormatChipsStack>
      </FileFormatsSectionStack>
    </Report>
  )
}
