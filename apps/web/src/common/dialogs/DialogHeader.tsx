import { type ReactNode, memo } from "react"
import { DialogTitle, IconButton, styled } from "@mui/material"
import { CloseRounded } from "@mui/icons-material"

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
}))

export const DialogHeader = memo(
  ({ title, onClose }: { title: ReactNode; onClose: () => void }) => {
    return (
      <StyledDialogTitle>
        {title}
        <IconButton onClick={onClose} aria-label="close" edge="end">
          <CloseRounded />
        </IconButton>
      </StyledDialogTitle>
    )
  },
)
