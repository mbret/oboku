import { type FC, memo } from "react"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import IconButton from "@mui/material/IconButton"
import { ArrowBackIosRounded, CloseRounded } from "@mui/icons-material"

export const DialogTopBar: FC<{
  title?: string
  onClose: () => void
  hasBackNavigation?: boolean
}> = memo(({ title, onClose, hasBackNavigation = false }) => {
  return (
    <AppBar position="static" elevation={0} color="transparent">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onClose}
          aria-label="close"
          size="large"
        >
          {hasBackNavigation ? <ArrowBackIosRounded /> : <CloseRounded />}
        </IconButton>
        <Typography
          variant="h6"
          style={{
            flexGrow: 1,
          }}
          noWrap
        >
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  )
})
