import { useRef, useCallback, type ReactNode, memo } from "react"
import { BottomNavigationAction, BottomNavigation, Box } from "@mui/material"
import {
  AccountCircleRounded,
  PortableWifiOffRounded,
  LocalLibraryRounded,
  CloudSyncRounded,
  HomeRounded,
  ExtensionRounded,
} from "@mui/icons-material"
import { useNavigate, useLocation } from "react-router"
import { useNetworkState } from "react-use"
import { SIGNAL_RESET, useSignalValue } from "reactjrx"
import {
  uploadBookDialogOpenedSignal,
  UploadBookDialog,
} from "../upload/UploadBookDialog"
import { PLUGIN_FILE_TYPE } from "@oboku/shared"
import { ROUTES } from "./routes"

export const BottomTabBar = memo(({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const isUploadBookFromDataSourceDialogOpened = useSignalValue(
    uploadBookDialogOpenedSignal,
  )
  const dragStatus = useRef<undefined | "entered">(undefined)

  // @todo cleanup, use a helper for "contains()"
  // @todo do as datasource tab navigator
  const normalizedPath = location.pathname.startsWith(ROUTES.LIBRARY_ROOT)
    ? ROUTES.LIBRARY_BOOKS
    : location.pathname.startsWith(ROUTES.SYNC)
      ? ROUTES.SYNC
      : location.pathname

  const onDragOver = useCallback(() => {
    if (dragStatus.current !== "entered") {
      dragStatus.current = "entered"
      uploadBookDialogOpenedSignal.setValue(PLUGIN_FILE_TYPE)
    }
  }, [])

  const onDragLeave = useCallback(() => {
    dragStatus.current = undefined

    if (uploadBookDialogOpenedSignal.getValue() === PLUGIN_FILE_TYPE) {
      uploadBookDialogOpenedSignal.setValue(SIGNAL_RESET)
    }
  }, [])

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
        position: "relative",
      }}
      onDragOver={onDragOver}
    >
      {children}
      <OfflineIcon />
      <BottomNavigation
        value={normalizedPath}
        onChange={(_event, newValue) => {
          navigate(newValue)
        }}
      >
        <BottomNavigationAction icon={<HomeRounded />} value={ROUTES.HOME} />
        <BottomNavigationAction
          icon={<LocalLibraryRounded />}
          value={ROUTES.LIBRARY_BOOKS}
        />
        <BottomNavigationAction
          icon={<CloudSyncRounded />}
          value={ROUTES.SYNC}
        />
        <BottomNavigationAction
          icon={<ExtensionRounded />}
          value={ROUTES.PLUGINS}
        />
        <BottomNavigationAction
          icon={<AccountCircleRounded />}
          value={ROUTES.PROFILE}
        />
      </BottomNavigation>
      {isUploadBookFromDataSourceDialogOpened && (
        <UploadBookDialog
          openWith={isUploadBookFromDataSourceDialogOpened}
          {...(isUploadBookFromDataSourceDialogOpened === PLUGIN_FILE_TYPE && {
            onDragLeave,
          })}
          onClose={() => uploadBookDialogOpenedSignal.setValue(SIGNAL_RESET)}
        />
      )}
    </Box>
  )
})

const OfflineIcon = () => {
  const network = useNetworkState()

  if (network.online) return null

  return (
    <Box
      sx={{
        position: "absolute",
        backgroundColor: ({ palette }) => palette.grey["700"],
        display: "flex",
        left: -5,
        bottom: -5,
        padding: 1,
        borderTopRightRadius: 5,
      }}
    >
      <PortableWifiOffRounded fontSize="small" style={{ color: "white" }} />
    </Box>
  )
}
