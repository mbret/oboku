import { DeleteRounded } from "@mui/icons-material"
import { IconButton, Stack, Typography } from "@mui/material"
import { memo, type ReactNode } from "react"
import { useConfirmation } from "../../common/useConfirmation"

export const TreeActionsSection = memo(function TreeActionsSection({
  children,
  onDeleteSelectedItems,
  selectedItemsCount,
}: {
  children?: ReactNode
  onDeleteSelectedItems: () => void
  selectedItemsCount: number
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
          Item(s) actions: {selectedItemsCount}
        </Typography>
        <IconButton
          disabled={selectedItemsCount === 0}
          onClick={() => {
            if (!confirmation()) {
              return
            }

            onDeleteSelectedItems()
          }}
        >
          <DeleteRounded />
        </IconButton>
      </Stack>
      {children}
    </Stack>
  )
})
