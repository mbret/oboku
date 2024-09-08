import React, { FC, ComponentProps, memo } from "react"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Typography, { TypographyProps } from "@mui/material/Typography"
import IconButton from "@mui/material/IconButton"
import {
  ArrowBackIosRounded,
  LockOpenRounded,
  MoreVertRounded,
  Search
} from "@mui/icons-material"
import { alpha, Box, InputBase, styled, useTheme } from "@mui/material"
import { useSafeGoBack } from "./useSafeGoBack"
import { ROUTES } from "../constants"
import { useNavigate } from "react-router-dom"
import { libraryStateSignal } from "../library/books/states"
import { useSignalValue } from "reactjrx"

const SearchInput = styled(InputBase)(({ theme }) => ({
  ".MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: "100%"
  }
}))

export const TopBarNavigation: FC<
  {
    title?: string
    showBack?: boolean
    rightComponent?: React.ReactNode
    middleComponent?: React.ReactNode
    hasSearch?: boolean
    hasLockLibrary?: boolean
    goBackDefaultTo?: string
    onMoreClick?: () => void
    TitleProps?: TypographyProps
  } & ComponentProps<typeof AppBar>
> = memo(
  ({
    title,
    showBack = true,
    position = "static",
    rightComponent,
    middleComponent,
    hasSearch = false,
    onMoreClick,
    goBackDefaultTo,
    hasLockLibrary,
    color,
    TitleProps,
    ...rest
  }) => {
    const isLibraryUnlocked = useSignalValue(
      libraryStateSignal,
      ({ isLibraryUnlocked }) => isLibraryUnlocked
    )
    const theme = useTheme()
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
            <Box flexGrow={1} overflow="hidden">
              {!hasSearch && !!title && (
                <Typography
                  variant="h6"
                  style={{ flexGrow: 1 }}
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                  overflow="hidden"
                  {...TitleProps}
                >
                  {title}
                </Typography>
              )}
              {hasSearch && (
                <Box
                  sx={{
                    position: "relative",
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.common.white, 0.15),
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.common.white, 0.25)
                    },
                    marginLeft: 0,
                    width: "100%"
                  }}
                  onClick={() => {
                    navigate(ROUTES.SEARCH)
                  }}
                >
                  <Box
                    sx={{
                      padding: theme.spacing(0, 2),
                      height: "100%",
                      position: "absolute",
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Search />
                  </Box>
                  <SearchInput
                    placeholder="Searchs"
                    readOnly
                    sx={{
                      color: "inherit"
                    }}
                    inputProps={{ "aria-label": "search" }}
                  />
                </Box>
              )}
              {middleComponent}
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
