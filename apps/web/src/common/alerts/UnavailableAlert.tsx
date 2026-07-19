import { Alert } from "@mui/material"
import type { types } from "./types"

export function UnavailableAlert({
  subject = "data",
  children,
  ...props
}: types) {
  return (
    <Alert severity="warning" {...props}>
      {children ?? `Your ${subject} can't be loaded right now.`}
    </Alert>
  )
}
