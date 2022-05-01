import React, { useEffect, useMemo, useState } from "react"
import { Tab, Tabs, IconButton, useTheme } from "@material-ui/core"
import {
  useHistory,
  useLocation,
  Route,
  Switch,
  Redirect
} from "react-router-dom"
import { LibraryBooksScreen } from "./LibraryBooksScreen"
import { LibraryTagsScreen } from "./LibraryTagsScreen"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { ROUTES } from "../constants"
import { LibraryCollectionScreen } from "./LibraryCollectionScreen"
import { useSyncLibrary } from "./helpers"
import { Sync } from "@material-ui/icons"
import { useCSS } from "../common/utils"

export const LibraryTopTabNavigator = () => {
  const location = useLocation()
  const history = useHistory()
  const classes = useStyles()
  const syncLibrary = useSyncLibrary()
  const [syncActive, setSyncActive] = useState(false)
  const theme = useTheme()

  useEffect(() => {
    if (syncActive) {
      setTimeout(() => {
        setSyncActive(false)
      }, 2000)
    }
  }, [syncActive])

  const TopBarNavigationRightComponent = useMemo(
    () => (
      <div style={{ marginLeft: theme.spacing(2) }}>
        <IconButton
          disabled={syncActive}
          onClick={() => {
            syncLibrary()
            setSyncActive(true)
          }}
          color="inherit"
        >
          <Sync />
        </IconButton>
      </div>
    ),
    [syncLibrary, syncActive, theme]
  )

  return (
    <div style={classes.container}>
      <TopBarNavigation
        title="Library"
        showBack={false}
        hasSearch
        rightComponent={TopBarNavigationRightComponent}
      />
      <Tabs
        style={classes.tabsContainer}
        value={location.pathname}
        indicatorColor="primary"
        onChange={(e, value) => {
          history.replace(value)
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
      <Switch>
        <Route exact path={ROUTES.LIBRARY_BOOKS}>
          <LibraryBooksScreen />
        </Route>
        <Route exact path={ROUTES.LIBRARY_COLLECTIONS}>
          <LibraryCollectionScreen />
        </Route>
        <Route exact path={ROUTES.LIBRARY_TAGS}>
          <LibraryTagsScreen />
        </Route>
        <Route path="/">
          <Redirect to={ROUTES.HOME} />
        </Route>
      </Switch>
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
        border: `1px solid ${theme.palette.primary.light}`,
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none"
      }
    }),
    [theme]
  )
}
