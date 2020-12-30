import React, { FC, ComponentProps } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import { ArrowBackIosRounded, Search } from '@material-ui/icons';
import { Box, fade, InputBase } from '@material-ui/core';
import { ROUTES } from './constants';
import { useNavigation } from './navigation/useNavigation';

export const TopBarNavigation: FC<{
  title?: string,
  showBack?: boolean,
  position?: ComponentProps<typeof AppBar>['position'],
  color?: ComponentProps<typeof AppBar>['color'],
  rightComponent?: React.ReactNode,
  hasSearch?: boolean
}> = ({ title, showBack = true, position = 'static', color = 'primary', rightComponent, hasSearch = false }) => {
  const classes = useStyles({ color });
  const { goBack, history } = useNavigation()

  return (
    <AppBar position={position} elevation={0} color={color}>
      <Toolbar>
        {showBack && (
          <IconButton
            edge="start"
            className={classes.menuButton}
            onClick={goBack}
          >
            <ArrowBackIosRounded />
          </IconButton>
        )}
        <Box flexGrow={1}>
          {!hasSearch && (
            <Typography variant="h6" className={classes.title}>
              {title}
            </Typography>
          )}
          {hasSearch && (
            <div className={classes.search} onClick={() => {
              history.push(ROUTES.SEARCH)
            }}>
              <div className={classes.searchIcon}>
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
        </Box>
        {rightComponent}
      </Toolbar>
    </AppBar>
  );
}

const useStyles = makeStyles((theme: Theme) => {
  type Props = { color: ComponentProps<typeof AppBar>['color'] }

  return createStyles({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(1),
      color: ({ color }: Props) => color === 'transparent' ? 'white' : 'inherit',
    },
    title: {
      flexGrow: 1,
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
    searchIcon: {
      padding: theme.spacing(0, 2),
      height: '100%',
      position: 'absolute',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputRoot: {
      color: 'inherit',
      width: '100%',
    },
    inputInput: {
      padding: theme.spacing(1, 1, 1, 0),
      paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
      width: '100%',
    },
  })
});