import { Alert } from "@mui/material"
import type { types } from "./types"

export function EmptyAlert({ subject = "data", children, ...props }: types) {
  return (
    <Alert severity="info" {...props}>
      {children ?? `You do not have any ${subject} right now.`}
    </Alert>
  )
}
