import { CloseRounded, DeleteRounded } from "@mui/icons-material"
import {
  IconButton,
  Stack,
  Toolbar as MuiToolbar,
  Typography,
} from "@mui/material"
import { MarkAsReadsIcon, UnreadIcon } from "../../common/icon"

export function SelectionToolbar({
  selectionCount,
  isSelectionActionPending = false,
  onCancelSelection,
  onDeleteSelection,
  onMarkSelectionAsRead,
  onMarkSelectionAsUnread,
}: {
  selectionCount: number
  isSelectionActionPending?: boolean
  onCancelSelection: () => void
  onDeleteSelection: () => void
  onMarkSelectionAsRead: () => void
  onMarkSelectionAsUnread: () => void
}) {
  return (
    <MuiToolbar>
      <IconButton
        edge="start"
        onClick={onCancelSelection}
        color="primary"
        disabled={isSelectionActionPending}
        aria-label="Cancel selection"
        aria-keyshortcuts="Escape"
      >
        <CloseRounded />
      </IconButton>
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
        <IconButton
          onClick={onMarkSelectionAsUnread}
          color="primary"
          aria-label="Mark selected books as unread"
        >
          <UnreadIcon />
        </IconButton>
        <IconButton
          onClick={onMarkSelectionAsRead}
          color="primary"
          disabled={isSelectionActionPending}
          aria-label="Mark selected books as read"
        >
          <MarkAsReadsIcon />
        </IconButton>
        <IconButton
          onClick={onDeleteSelection}
          color="primary"
          disabled={isSelectionActionPending}
          aria-label="Delete selected books"
        >
          <DeleteRounded />
        </IconButton>
      </Stack>
    </MuiToolbar>
  )
}
