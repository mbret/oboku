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
  locationsCount,
  onAction,
  resolveItemsAccess,
  variant = "outlined",
}: {
  actionLabel?: string
  isLoading?: boolean
  locationsCount: number
  onAction: () => void
  resolveItemsAccess?: ResolveItemsAccess
  variant?: "contained" | "outlined" | "text"
}) {
  return (
    <Stack
      sx={{
        gap: 1,
      }}
    >
      <Button loading={isLoading} onClick={onAction} variant={variant}>
        {actionLabel}
      </Button>
      <Typography variant="caption" align="center">
        You picked {locationsCount} location(s)
      </Typography>
      <Typography variant="caption" align="center" color="text.secondary">
        oboku syncs only the folders and files you pick. A folder you pick does
        not add the files inside it, so pick those files too. On a computer, the
        picker selects many items at once.
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
