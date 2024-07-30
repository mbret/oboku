import React, { FC, ComponentProps, memo } from "react"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import IconButton from "@mui/material/IconButton"
import {
  ArrowBackIosRounded,
  LockOpenRounded,
  MoreVertRounded,
  Search
} from "@mui/icons-material"
import { alpha, Box, InputBase, useTheme } from "@mui/material"
import makeStyles from "@mui/styles/makeStyles"
import { useSafeGoBack } from "./useSafeGoBack"
import { ROUTES } from "../constants"
import { useCSS } from "../common/utils"
import { useNavigate } from "react-router-dom"
import { libraryStateSignal } from "../library/states"
import { useSignalValue } from "reactjrx"

export const TopBarNavigation: FC<
  {
    title?: string
    showBack?: boolean
    rightComponent?: React.ReactNode
    hasSearch?: boolean
    hasLockLibrary?: boolean
    goBackDefaultTo?: string
    onMoreClick?: () => void
  } & ComponentProps<typeof AppBar>
> = memo(
  ({
    title,
    showBack = true,
    position = "static",
    rightComponent,
    hasSearch = false,
    onMoreClick,
    goBackDefaultTo,
    hasLockLibrary,
    color,
    ...rest
  }) => {
    const isLibraryUnlocked = useSignalValue(
      libraryStateSignal,
      ({ isLibraryUnlocked }) => isLibraryUnlocked
    )
    const { styles, classes } = useStyles({ color })
    const { goBack } = useSafeGoBack()
    const navigate = useNavigate()

    return (
      <AppBar position={position} elevation={0} color={color} {...rest}>
        <Toolbar>
          <>
            {showBack && (
              <IconButton
                edge="start"
                onClick={() => goBack(goBackDefaultTo)}
                size="large"
                color="inherit"
                sx={{ mr: 1 }}
              >
                <ArrowBackIosRounded />
              </IconButton>
            )}
            <Box flexGrow={1}>
              {!hasSearch && (
                <Typography variant="h6" style={{ flexGrow: 1 }}>
                  {title}
                </Typography>
              )}
              {hasSearch && (
                <Box
                  className={classes.search}
                  onClick={() => {
                    navigate(ROUTES.SEARCH)
                  }}
                >
                  <div style={styles.searchIcon}>
                    <Search />
                  </div>
                  <InputBase
                    placeholder="Search…"
                    readOnly
                    classes={{
                      root: classes.inputRoot,
                      input: classes.inputInput
                    }}
                    inputProps={{ "aria-label": "search" }}
                  />
                </Box>
              )}
            </Box>
            <Box display="flex" alignItems="center" ml={2}>
              {hasLockLibrary && isLibraryUnlocked && (
                <IconButton
                  onClick={() => {
                    libraryStateSignal.setValue((state) => ({
                      ...state,
                      isLibraryUnlocked: false
                    }))
                  }}
                  size="large"
                  color="inherit"
                >
                  <LockOpenRounded />
                </IconButton>
              )}
              {rightComponent}
              {!rightComponent && !!onMoreClick && (
                <IconButton onClick={onMoreClick} size="large" color="inherit">
                  <MoreVertRounded />
                </IconButton>
              )}
            </Box>
          </>
        </Toolbar>
      </AppBar>
    )
  }
)

const useClasses = makeStyles((theme) => ({
  inputRoot: {
    color: "inherit",
    width: "100%"
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: "100%"
  },
  search: {
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: alpha(theme.palette.common.white, 0.25)
    },
    marginLeft: 0,
    width: "100%"
  }
}))

const useStyles = ({
  color
}: {
  color: ComponentProps<typeof AppBar>["color"]
}) => {
  const theme = useTheme()
  const classes = useClasses()

  const styles = useCSS(
    () => ({
      menuButton: {
        // marginRight: theme.spacing(1),
        color: color === "transparent" ? "white" : "inherit"
      },
      menuButtonEnd: {
        color: color === "transparent" ? "white" : "inherit"
      },
      searchIcon: {
        padding: theme.spacing(0, 2),
        height: "100%",
        position: "absolute",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }
    }),
    [theme, color]
  )

  return { styles, classes }
}
