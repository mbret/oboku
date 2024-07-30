import { useEffect, useMemo, useState } from "react"
import { Tab, Tabs, IconButton, useTheme } from "@mui/material"
import { useNavigate, useLocation, Outlet } from "react-router-dom"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { ROUTES } from "../constants"
import { Sync } from "@mui/icons-material"
import { useCSS } from "../common/utils"
import { useSignalValue } from "reactjrx"
import { syncSignal } from "../rxdb/replication/states"
import { triggerReplication } from "../rxdb/replication/triggerReplication"

export const LibraryTopTabNavigator = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const classes = useStyles()
  const [syncActive, setSyncActive] = useState(false)
  const theme = useTheme()
  const activeSyncs = useSignalValue(syncSignal, (state) => state.active)

  useEffect(() => {
    if (syncActive) {
      setTimeout(() => {
        setSyncActive(false)
      }, 2000)
    }
  }, [syncActive])

  const TopBarNavigationRightComponent = useMemo(
    () => (
      <IconButton
        disabled={activeSyncs > 0}
        onClick={() => {
          triggerReplication()
          setSyncActive(true)
        }}
        size="large"
        color="inherit"
      >
        <Sync />
      </IconButton>
    ),
    [activeSyncs]
  )

  return (
    <div style={classes.container}>
      <TopBarNavigation
        title="Library"
        showBack={false}
        hasSearch
        hasLockLibrary
        rightComponent={TopBarNavigationRightComponent}
      />
      <Tabs
        style={classes.tabsContainer}
        value={location.pathname}
        indicatorColor="primary"
        onChange={(e, value) => {
          navigate(value, { replace: true })
        }}
      >
        <Tab
          label="Books"
          value={ROUTES.LIBRARY_BOOKS}
          disableFocusRipple
          disableRipple
          disableTouchRipple
        />
        <Tab
          label="Collections"
          value={ROUTES.LIBRARY_COLLECTIONS}
          disableFocusRipple
          disableRipple
          disableTouchRipple
        />
        <Tab
          label="Tags"
          value={ROUTES.LIBRARY_TAGS}
          disableFocusRipple
          disableRipple
          disableTouchRipple
        />
      </Tabs>
      <Outlet />
    </div>
  )
}

const useStyles = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      container: {
        display: "flex",
        flexFlow: "column",
        overflow: "hidden",
        flex: 1
      },
      tabsContainer: {
        borderBottom: `1px solid ${theme.palette.primary.light}`,
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none"
      }
    }),
    [theme]
  )
}
