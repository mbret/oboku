import { DeleteRounded } from "@mui/icons-material"
import { IconButton, Stack, Typography } from "@mui/material"
import { memo, type ReactNode } from "react"
import { useConfirmation } from "../../../common/useConfirmation"

export const TreeActionsSection = memo(function TreeActionsSection({
  children,
  onRemoveSelectedLocations,
  selectedLocationsCount,
}: {
  children?: ReactNode
  onRemoveSelectedLocations: () => void
  selectedLocationsCount: number
}) {
  const confirmation = useConfirmation()

  return (
    <Stack
      sx={{
        gap: 1,
      }}
    >
      <Stack
        direction="row"
        sx={{
          gap: 1,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="caption">
          Selected locations: {selectedLocationsCount}
        </Typography>
        <IconButton
          aria-label="Remove the selected locations"
          disabled={selectedLocationsCount === 0}
          onClick={() => {
            if (!confirmation()) {
              return
            }

            onRemoveSelectedLocations()
          }}
        >
          <DeleteRounded />
        </IconButton>
      </Stack>
      {children}
    </Stack>
  )
})
