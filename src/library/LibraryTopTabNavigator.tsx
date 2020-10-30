import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Tab, Tabs } from '@material-ui/core'
import { useHistory, useLocation, Route, Switch, Redirect } from 'react-router-dom'
import { LibraryBooksScreen } from './LibraryBooksScreen'
import { LibraryTagsScreen } from './LibraryTagsScreen'
import { TopBarNavigation } from '../TopBarNavigation'
import { ROUTES } from '../constants'
import { LibrarySeriesScreen } from './LibrarySeriesScreen'

export const LibraryTopTabNavigator = () => {
  const location = useLocation()
  const history = useHistory()
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <TopBarNavigation title="Library" showBack={false} />
      <Tabs
        className={classes.tabsContainer}
        value={location.pathname}
        indicatorColor="primary"
        onChange={(e, value) => {
          history.replace(value)
        }}
      >
        <Tab label="Books" value={ROUTES.LIBRARY_BOOKS} disableFocusRipple disableRipple disableTouchRipple />
        <Tab label="Series" value={ROUTES.LIBRARY_SERIES} disableFocusRipple disableRipple disableTouchRipple />
        <Tab label="Tags" value={ROUTES.LIBRARY_TAGS} disableFocusRipple disableRipple disableTouchRipple />
      </Tabs>
      <Switch>
        <Route exact path={ROUTES.LIBRARY_BOOKS}>
          <LibraryBooksScreen />
        </Route>
        <Route exact path={ROUTES.LIBRARY_SERIES} >
          <LibrarySeriesScreen />
        </Route>
        <Route exact path={ROUTES.LIBRARY_TAGS} >
          <LibraryTagsScreen />
        </Route>
        <Route path="/">
          <Redirect to={ROUTES.HOME} />
        </Route>
      </Switch>
    </div>
  )
}

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexFlow: 'column',
    overflow: 'hidden',
    flex: 1,
  },
  tabsContainer: {
    border: `1px solid ${theme.palette.primary.light}`
  }
}));