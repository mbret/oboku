import { Alert } from "@mui/material"
import type { types } from "./types"

export function FetchErrorAlert({
  subject = "data",
  children,
  ...props
}: types) {
  return (
    <Alert severity="error" {...props}>
      {children ??
        `Something went wrong while loading your ${subject}. Please try again later.`}
    </Alert>
  )
}
