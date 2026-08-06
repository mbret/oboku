import { Stack, Typography, styled } from "@mui/material"
import type { ReactNode } from "react"

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

export function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <ReportRowStack>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </ReportRowStack>
  )
}

export function Report({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{title}</Typography>
      <ReportGridStack>{children}</ReportGridStack>
    </Stack>
  )
}
