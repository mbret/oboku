import { Button, Stack, Typography } from "@mui/material"
import { memo } from "react"
import { ResolveLocationsAccessAlert } from "./ResolveLocationsAccessAlert"

type ResolveLocationsAccess = {
  actionLabel?: string
  isLoading?: boolean
  onAction: () => void
}

export const PickLocationsSection = memo(function PickLocationsSection({
  actionLabel = "Add folders/files",
  isLoading = false,
  locationsCount,
  onAction,
  resolveLocationsAccess,
  variant = "outlined",
}: {
  actionLabel?: string
  isLoading?: boolean
  locationsCount: number
  onAction: () => void
  resolveLocationsAccess?: ResolveLocationsAccess
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
      {resolveLocationsAccess ? (
        <ResolveLocationsAccessAlert
          actionLabel={resolveLocationsAccess.actionLabel}
          isLoading={resolveLocationsAccess.isLoading}
          onAction={resolveLocationsAccess.onAction}
        />
      ) : null}
    </Stack>
  )
})
