import { FC, memo } from "react"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import IconButton from "@mui/material/IconButton"
import { ArrowBackIosRounded, CloseRounded } from "@mui/icons-material"
import { useCSS } from "../common/utils"

export const DialogTopBar: FC<{
  title?: string
  onClose: () => void
  hasBackNavigation?: boolean
}> = memo(({ title, onClose, hasBackNavigation = false }) => {
  const { styles } = useStyles()

  return (
    <AppBar position="static" elevation={0} color="transparent">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onClose}
          aria-label="close"
          size="large">
          {hasBackNavigation ? <ArrowBackIosRounded /> : <CloseRounded />}
        </IconButton>
        <Typography variant="h6" style={styles.title} noWrap>
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
})

const useStyles = () => {
  const styles = useCSS(
    () => ({
      title: {
        flexGrow: 1
      }
    }),
    []
  )

  return { styles }
}
