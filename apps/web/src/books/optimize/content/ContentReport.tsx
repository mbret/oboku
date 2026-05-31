import { Stack, Typography, styled } from "@mui/material"
import { formatBytes } from "@oboku/shared"
import type { FileInspection } from "../useFileInspection"

const ReportGridStack = styled(Stack)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5),
  gap: theme.spacing(1),
}))

const ReportRowStack = styled(Stack)({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 8,
})

type ReportRow = {
  label: string
  value: string
}

const buildRows = (inspection: FileInspection): ReportRow[] => {
  const rows: ReportRow[] = [
    { label: "File size", value: formatBytes(inspection.fileSize) ?? "—" },
    { label: "Images", value: String(inspection.imageCount) },
  ]

  if (inspection.imageBytes > 0) {
    rows.push({
      label: "Images total size",
      value: formatBytes(inspection.imageBytes) ?? "—",
    })
  }

  if (inspection.averageImageResolution) {
    const { width, height } = inspection.averageImageResolution
    rows.push({
      label: "Average resolution",
      value: `${width} × ${height} px`,
    })
  }

  return rows
}

type Props = {
  inspection: FileInspection | undefined
}

export function ContentReport({ inspection }: Props) {
  if (!inspection) {
    return <Typography variant="body2">Waiting for the file…</Typography>
  }

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Content report</Typography>
      <ReportGridStack>
        {buildRows(inspection).map((row) => (
          <ReportRowStack key={row.label}>
            <Typography variant="body2" color="text.secondary">
              {row.label}
            </Typography>
            <Typography variant="body2">{row.value}</Typography>
          </ReportRowStack>
        ))}
      </ReportGridStack>
    </Stack>
  )
}
