import { Alert, Button } from "@mui/material"
import { memo } from "react"

export const ResolveItemsAccessAlert = memo(function ResolveItemsAccessAlert({
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
      Some saved items could not be resolved. Grant access to try resolving them
      again.
    </Alert>
  )
})
