import React from 'react'
import { makeStyles, BottomNavigationAction, BottomNavigation } from '@material-ui/core'
import { HomeOutlined, Home, LocalLibrary, LocalLibraryOutlined, Storage, StorageOutlined, AccountCircleRounded, AccountCircleOutlined, PortableWifiOffRounded } from '@material-ui/icons'
import { useHistory, useLocation } from 'react-router-dom'
import { ROUTES } from './constants'
import { useNetworkState } from 'react-use'

export const BottomTabBar = ({ children }) => {
  const location = useLocation()
  const history = useHistory()
  const classes = useStyles();
  const normalizedPath = location.pathname.startsWith(ROUTES.LIBRARY_ROOT)
    ? ROUTES.LIBRARY_BOOKS
    : location.pathname

  return (
    <div className={classes.container}>
      {children}
      <OfflineIcon />
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

const OfflineIcon = () => {
  const classes = useStyles();
  const network = useNetworkState()
  
  if (network.online) return null
  
  return (
    <div className={classes.offlineWrapper}>
      <PortableWifiOffRounded fontSize="small" className={classes.offlineIcon} />
    </div>
  )
}

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    flex: 1
  },
  root: {
    borderTopColor: theme.palette.primary.main,
    borderTopWidth: 1,
    borderTopStyle: 'solid'
  },
  offlineWrapper: {
    position: 'absolute',
    backgroundColor: theme.palette.grey['700'],
    display: 'flex',
    left: 0,
    bottom: 0,
    paddingLeft: 1,
    paddingBottom: 1,
    paddingRight: 5,
    paddingTop: 5,
    borderTopRightRadius: 15,
  },
  offlineIcon: { color: 'white' }
}));