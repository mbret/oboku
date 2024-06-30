import { useRef, useCallback, ReactNode } from "react"
import {
  BottomNavigationAction,
  BottomNavigation,
  useTheme
} from "@mui/material"
import {
  AccountCircleRounded,
  PortableWifiOffRounded,
  LocalLibraryRounded,
  CloudSyncRounded,
  HomeRounded
} from "@mui/icons-material"
import { useNavigate, useLocation } from "react-router-dom"
import { ROUTES } from "./constants"
import { useNetworkState } from "react-use"
import { useCSS } from "./common/utils"
import { SIGNAL_RESET, useSignalValue } from "reactjrx"
import { UploadBookFromDataSource } from "./upload/UploadBookFromDataSource"
import { isUploadBookFromDataSourceDialogOpenedSignal } from "./upload/state"
import { PLUGIN_FILE_TYPE } from "@oboku/shared"

export const BottomTabBar = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const classes = useStyles()
  const isUploadBookFromDataSourceDialogOpened = useSignalValue(
    isUploadBookFromDataSourceDialogOpenedSignal
  )
  const dragStatus = useRef<undefined | "entered">(undefined)

  // @todo cleanup, use a helper for "contains()"
  // @todo do as datasource tab navigator
  const normalizedPath = location.pathname.startsWith(ROUTES.LIBRARY_ROOT)
    ? ROUTES.LIBRARY_BOOKS
    : location.pathname.startsWith(ROUTES.DATASOURCES)
      ? ROUTES.DATASOURCES
      : location.pathname

  const onDragOver = useCallback(() => {
    if (dragStatus.current !== "entered") {
      dragStatus.current = "entered"
      isUploadBookFromDataSourceDialogOpenedSignal.setValue(PLUGIN_FILE_TYPE)
    }
  }, [])

  const onDragLeave = useCallback(() => {
    dragStatus.current = undefined

    if (
      isUploadBookFromDataSourceDialogOpenedSignal.getValue() ===
      PLUGIN_FILE_TYPE
    ) {
      isUploadBookFromDataSourceDialogOpenedSignal.setValue(SIGNAL_RESET)
    }
  }, [])

  return (
    <div style={classes.container} onDragOver={onDragOver}>
      {children}
      <OfflineIcon />
      <BottomNavigation
        value={normalizedPath}
        onChange={(event, newValue) => {
          navigate(newValue)
        }}
        style={classes.root}
        showLabels={true}
      >
        <BottomNavigationAction
          icon={<HomeRounded />}
          showLabel={false}
          disableRipple
          value={ROUTES.HOME}
        />
        <BottomNavigationAction
          icon={<LocalLibraryRounded />}
          showLabel={false}
          disableRipple
          value={ROUTES.LIBRARY_BOOKS}
        />
        <BottomNavigationAction
          icon={<CloudSyncRounded />}
          showLabel={false}
          disableRipple
          value={ROUTES.DATASOURCES}
        />
        <BottomNavigationAction
          icon={<AccountCircleRounded />}
          showLabel={false}
          disableRipple
          value={ROUTES.PROFILE}
        />
      </BottomNavigation>
      {isUploadBookFromDataSourceDialogOpened && (
        <UploadBookFromDataSource
          openWith={isUploadBookFromDataSourceDialogOpened}
          {...(isUploadBookFromDataSourceDialogOpened === PLUGIN_FILE_TYPE && {
            onDragLeave
          })}
          onClose={() =>
            isUploadBookFromDataSourceDialogOpenedSignal.setValue(SIGNAL_RESET)
          }
        />
      )}
    </div>
  )
}

const OfflineIcon = () => {
  const classes = useStyles()
  const network = useNetworkState()

  if (network.online) return null

  return (
    <div style={classes.offlineWrapper}>
      <PortableWifiOffRounded fontSize="small" style={classes.offlineIcon} />
    </div>
  )
}

const useStyles = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      container: {
        display: "flex",
        height: "100%",
        flexDirection: "column",
        flex: 1
      },
      root: {
        borderTopColor: theme.palette.primary.main,
        borderTopWidth: 1,
        borderTopStyle: "solid"
      },
      offlineWrapper: {
        position: "absolute",
        backgroundColor: theme.palette.grey["700"],
        display: "flex",
        left: 0,
        bottom: 0,
        paddingLeft: 1,
        paddingBottom: 1,
        paddingRight: 5,
        paddingTop: 5,
        borderTopRightRadius: 15
      },
      offlineIcon: { color: "white" }
    }),
    [theme]
  )
}
