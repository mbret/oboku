import { Alert } from "@mui/material"
import type { types } from "./types"

export function LoadingAlert({ subject = "data", children, ...props }: types) {
  return (
    <Alert severity="info" {...props}>
      {children ?? `Loading ${subject}…`}
    </Alert>
  )
}
