import type { ReactNode } from "react"
import {
  CloseRounded,
  DeselectRounded,
  SelectAllRounded,
} from "@mui/icons-material"
import {
  IconButton,
  Stack,
  Toolbar as MuiToolbar,
  Typography,
} from "@mui/material"

export type SelectionToolbarProps = {
  selectionCount: number
  /**
   * Total number of selectable items. When provided, it is used to auto-disable
   * the select-all button once everything is already selected.
   */
  totalCount?: number
  variant?: "regular" | "dense"
  isActionPending?: boolean
  /**
   * When provided, renders a leading close icon button that exits the
   * selection (e.g. when selection is a temporary mode of a larger screen).
   */
  onCancel?: () => void
  onSelectAll?: () => void
  onUnselectAll?: () => void
  /**
   * Additional action buttons rendered on the trailing edge of the toolbar,
   * after the built-in select/unselect actions.
   */
  actions?: ReactNode
}

export function SelectionToolbar({
  selectionCount,
  totalCount,
  variant = "regular",
  isActionPending = false,
  onCancel,
  onSelectAll,
  onUnselectAll,
  actions,
}: SelectionToolbarProps) {
  const selectAllDisabled =
    isActionPending ||
    (typeof totalCount === "number" && selectionCount >= totalCount)
  const unselectAllDisabled = isActionPending || selectionCount === 0

  return (
    <MuiToolbar variant={variant}>
      {onCancel && (
        <IconButton
          edge="start"
          onClick={onCancel}
          color="primary"
          disabled={isActionPending}
          aria-label="Cancel selection"
          aria-keyshortcuts="Escape"
          sx={{ mr: 1 }}
        >
          <CloseRounded />
        </IconButton>
      )}
      <Stack
        flexGrow={1}
        flexDirection="row"
        alignItems="center"
        overflow="hidden"
      >
        <Typography color="primary" noWrap>
          {selectionCount} selected
        </Typography>
      </Stack>
      <Stack flexDirection="row" alignItems="center" gap={1}>
        {onSelectAll && (
          <IconButton
            onClick={onSelectAll}
            color="primary"
            disabled={selectAllDisabled}
            aria-label="Select all"
          >
            <SelectAllRounded />
          </IconButton>
        )}
        {onUnselectAll && (
          <IconButton
            onClick={onUnselectAll}
            color="primary"
            disabled={unselectAllDisabled}
            aria-label="Unselect all"
          >
            <DeselectRounded />
          </IconButton>
        )}
        {actions}
      </Stack>
    </MuiToolbar>
  )
}
