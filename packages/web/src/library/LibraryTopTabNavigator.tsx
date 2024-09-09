import { useEffect, useMemo, useState } from "react"
import { Tab, Tabs, IconButton } from "@mui/material"
import { useNavigate, useLocation, Outlet } from "react-router-dom"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { ROUTES } from "../constants.web"
import { Sync } from "@mui/icons-material"
import { useSignalValue } from "reactjrx"
import { syncSignal } from "../rxdb/replication/states"
import { triggerReplication } from "../rxdb/replication/triggerReplication"

export const LibraryTopTabNavigator = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [syncActive, setSyncActive] = useState(false)
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
    <div
      style={{
        display: "flex",
        flexFlow: "column",
        overflow: "hidden",
        flex: 1
      }}
    >
      <TopBarNavigation
        title="Library"
        showBack={false}
        hasSearch
        hasLockLibrary
        rightComponent={TopBarNavigationRightComponent}
      />
      <Tabs
        value={location.pathname}
        indicatorColor="primary"
        onChange={(e, value) => {
          navigate(value, { replace: true })
        }}
      >
        <Tab label="Books" value={ROUTES.LIBRARY_BOOKS} />
        <Tab label="Shelves" value={ROUTES.LIBRARY_COLLECTIONS} />
        <Tab label="Tags" value={ROUTES.LIBRARY_TAGS} />
      </Tabs>
      <Outlet />
    </div>
  )
}
