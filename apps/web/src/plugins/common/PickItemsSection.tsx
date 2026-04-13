import { Button, Stack, Typography } from "@mui/material"
import { memo } from "react"
import { ResolveItemsAccessAlert } from "./ResolveItemsAccessAlert"

type ResolveItemsAccess = {
  actionLabel?: string
  isLoading?: boolean
  onAction: () => void
}

export const PickItemsSection = memo(function PickItemsSection({
  actionLabel = "Add folders/files",
  isLoading = false,
  itemsCount,
  onAction,
  resolveItemsAccess,
  variant = "outlined",
}: {
  actionLabel?: string
  isLoading?: boolean
  itemsCount: number
  onAction: () => void
  resolveItemsAccess?: ResolveItemsAccess
  variant?: "contained" | "outlined" | "text"
}) {
  return (
    <Stack gap={1}>
      <Button loading={isLoading} onClick={onAction} variant={variant}>
        {actionLabel}
      </Button>
      <Typography variant="caption" align="center">
        You have {itemsCount} item(s) registered
      </Typography>
      {resolveItemsAccess ? (
        <ResolveItemsAccessAlert
          actionLabel={resolveItemsAccess.actionLabel}
          isLoading={resolveItemsAccess.isLoading}
          onAction={resolveItemsAccess.onAction}
        />
      ) : null}
    </Stack>
  )
})
