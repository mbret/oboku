import React, { FC, ComponentProps, memo } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import { ArrowBackIosRounded, MoreVertRounded, Search } from '@material-ui/icons';
import { fade, InputBase, makeStyles, useTheme } from '@material-ui/core';
import { ROUTES } from './constants';
import { useNavigation } from './navigation/useNavigation';
import { useCSS } from './common/utils';

export const TopBarNavigation: FC<{
  title?: string,
  showBack?: boolean,
  position?: ComponentProps<typeof AppBar>['position'],
  color?: ComponentProps<typeof AppBar>['color'],
  rightComponent?: React.ReactNode,
  hasSearch?: boolean,
  onMoreClick?: () => void
}> = memo(({ title, showBack = true, position = 'static', color = 'primary', rightComponent, hasSearch = false, onMoreClick }) => {
  const { styles, classes } = useStyles({ color });
  const { goBack, history } = useNavigation()

  return (
    <AppBar position={position} elevation={0} color={color}>
      <Toolbar>
        {showBack && (
          <IconButton
            edge="start"
            style={styles.menuButton}
            onClick={goBack}
          >
            <ArrowBackIosRounded />
          </IconButton>
        )}
        <div style={{ flexGrow: 1 }}>
          {!hasSearch && (
            <Typography variant="h6" style={styles.title}>
              {title}
            </Typography>
          )}
          {hasSearch && (
            <div className={classes.search} onClick={() => {
              history.push(ROUTES.SEARCH)
            }}>
              <div style={styles.searchIcon}>
                <Search />
              </div>
              <InputBase
                placeholder="Search…"
                readOnly
                classes={{
                  root: classes.inputRoot,
                  input: classes.inputInput,
                }}
                inputProps={{ 'aria-label': 'search' }}
              />
            </div>
          )}
        </div>
        {rightComponent}
        {!rightComponent && !!onMoreClick && (
          <IconButton
            edge="end"
            style={styles.menuButtonEnd}
            onClick={onMoreClick}
          >
            <MoreVertRounded />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
})

const useClasses = makeStyles(theme => ({
  inputRoot: {
    color: 'inherit',
    width: '100%',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    width: '100%',
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
  },
}))

const useStyles = ({ color }: { color: ComponentProps<typeof AppBar>['color'] }) => {
  const theme = useTheme()
  const classes = useClasses()

  const styles = useCSS(() => ({
    menuButton: {
      marginRight: theme.spacing(1),
      color: color === 'transparent' ? 'white' : 'inherit',
    },
    menuButtonEnd: {
      color: color === 'transparent' ? 'white' : 'inherit',
    },
    searchIcon: {
      padding: theme.spacing(0, 2),
      height: '100%',
      position: 'absolute',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flexGrow: 1,
    },
  }), [theme, color])

  return { styles, classes }
}