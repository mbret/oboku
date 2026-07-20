import { Stack, Typography, styled } from "@mui/material"
import { formatBytes } from "@oboku/shared"
import { useBookOptimize } from "../BookOptimizeProvider"

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

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <ReportRowStack>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </ReportRowStack>
  )
}

export function ContentReport() {
  const { inspection } = useBookOptimize()
  const { fileSize, imageCount, imageBytes, averageImageResolution } =
    inspection

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Content report</Typography>
      <ReportGridStack>
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
      </ReportGridStack>
    </Stack>
  )
}
