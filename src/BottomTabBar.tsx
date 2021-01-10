import React from 'react'
import { makeStyles, BottomNavigationAction, BottomNavigation } from '@material-ui/core'
import { HomeOutlined, Home, LocalLibrary, LocalLibraryOutlined, Storage, StorageOutlined, AccountCircleRounded, AccountCircleOutlined } from '@material-ui/icons'
import { useHistory, useLocation } from 'react-router-dom'
import { ROUTES } from './constants'

export const BottomTabBar = ({ children }) => {
  const location = useLocation()
  const history = useHistory()
  const classes = useStyles();
  const normalizedPath = location.pathname.startsWith(ROUTES.LIBRARY_ROOT)
    ? ROUTES.LIBRARY_BOOKS
    : location.pathname

  return (
    <div style={{
      display: 'flex',
      maxHeight: '100%',
      flexDirection: 'column',
      flex: 1
    }}>
      {children}
      <BottomNavigation
        value={normalizedPath}
        onChange={(event, newValue) => {
          history.push(newValue)
        }}
        className={classes.root}
        showLabels={true}
      >
        <BottomNavigationAction
          icon={normalizedPath === ROUTES.HOME ? <Home /> : <HomeOutlined />}
          showLabel={false}
          disableRipple
          value={ROUTES.HOME}
        />
        <BottomNavigationAction
          icon={normalizedPath === ROUTES.LIBRARY_BOOKS ? <LocalLibrary /> : <LocalLibraryOutlined />}
          showLabel={false}
          disableRipple
          value={ROUTES.LIBRARY_BOOKS}
        />
        <BottomNavigationAction
          icon={normalizedPath === ROUTES.DATASOURCES ? <Storage /> : <StorageOutlined />}
          showLabel={false}
          disableRipple
          value={ROUTES.DATASOURCES}
        />
        <BottomNavigationAction
          icon={normalizedPath === ROUTES.PROFILE ? <AccountCircleRounded /> : <AccountCircleOutlined />}
          showLabel={false}
          disableRipple
          value={ROUTES.PROFILE}
        />
      </BottomNavigation>
    </div>
  )
}

const useStyles = makeStyles(theme => ({
  root: {
    borderTopColor: theme.palette.primary.main,
    borderTopWidth: 1,
    borderTopStyle: 'solid'
  },
}));