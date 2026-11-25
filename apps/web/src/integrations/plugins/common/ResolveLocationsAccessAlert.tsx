import { Alert, Button } from "@mui/material"
import { memo } from "react"

export const ResolveLocationsAccessAlert = memo(
  function ResolveLocationsAccessAlert({
    actionLabel = "Grant",
    isLoading = false,
    onAction,
  }: {
    actionLabel?: string
    isLoading?: boolean
    onAction: () => void
  }) {
    return (
      <Alert
        severity="warning"
        action={
          <Button loading={isLoading} size="small" onClick={onAction}>
            {actionLabel}
          </Button>
        }
      >
        oboku cannot open some saved locations. Grant access to try again.
      </Alert>
    )
  },
)
