import { Chip } from "@mui/material"

export function KeyChip({ label }: { label: string }) {
  return <Chip label={label} size="small" variant="outlined" />
}
