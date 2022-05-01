import React, { useRef, useCallback } from "react"
import {
  BottomNavigationAction,
  BottomNavigation,
  useTheme
} from "@material-ui/core"
import {
  HomeOutlined,
  Home,
  LocalLibrary,
  LocalLibraryOutlined,
  Storage,
  StorageOutlined,
  AccountCircleRounded,
  AccountCircleOutlined,
  PortableWifiOffRounded
} from "@material-ui/icons"
import { useHistory, useLocation } from "react-router-dom"
import { ROUTES } from "./constants"
import { useNetworkState } from "react-use"
import { useCSS } from "./common/utils"
import { UploadBookFromDevice } from "./upload/UploadBookFromDevice"
import { useRecoilState } from "recoil"
import { isUploadBookFromDeviceOpenedFromState } from "./upload/state"

export const BottomTabBar = ({ children }) => {
  const location = useLocation()
  const history = useHistory()
  const classes = useStyles()
  const [isUploadBookFromDeviceOpened, setIsUploadBookFromDeviceOpened] =
    useRecoilState(isUploadBookFromDeviceOpenedFromState)
  const dragStatus = useRef<undefined | "entered">(undefined)
  const normalizedPath = location.pathname.startsWith(ROUTES.LIBRARY_ROOT)
    ? ROUTES.LIBRARY_BOOKS
    : location.pathname

  const onDragOver = useCallback(() => {
    if (dragStatus.current !== "entered") {
      dragStatus.current = "entered"
      setIsUploadBookFromDeviceOpened("outside")
    }
  }, [setIsUploadBookFromDeviceOpened])

  return (
    <div style={classes.container} onDragOver={onDragOver}>
      {children}
      <OfflineIcon />
      <BottomNavigation
        value={normalizedPath}
        onChange={(event, newValue) => {
          history.push(newValue)
        }}
        style={classes.root}
        showLabels={true}
      >
        <BottomNavigationAction
          icon={normalizedPath === ROUTES.HOME ? <Home /> : <HomeOutlined />}
          showLabel={false}
          disableRipple
          value={ROUTES.HOME}
        />
        <BottomNavigationAction
          icon={
            normalizedPath === ROUTES.LIBRARY_BOOKS ? (
              <LocalLibrary />
            ) : (
              <LocalLibraryOutlined />
            )
          }
          showLabel={false}
          disableRipple
          value={ROUTES.LIBRARY_BOOKS}
        />
        <BottomNavigationAction
          icon={
            normalizedPath === ROUTES.DATASOURCES ? (
              <Storage />
            ) : (
              <StorageOutlined />
            )
          }
          showLabel={false}
          disableRipple
          value={ROUTES.DATASOURCES}
        />
        <BottomNavigationAction
          icon={
            normalizedPath === ROUTES.PROFILE ? (
              <AccountCircleRounded />
            ) : (
              <AccountCircleOutlined />
            )
          }
          showLabel={false}
          disableRipple
          value={ROUTES.PROFILE}
        />
      </BottomNavigation>
      {isUploadBookFromDeviceOpened && (
        <UploadBookFromDevice
          openFrom={isUploadBookFromDeviceOpened}
          onClose={() => {
            dragStatus.current = undefined
            setIsUploadBookFromDeviceOpened(false)
          }}
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
