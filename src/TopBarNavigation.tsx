import React, { FC, ComponentProps } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import { ArrowBackIosRounded } from '@material-ui/icons';
import { useHistory } from 'react-router-dom';

export const TopBarNavigation: FC<{
  title: string,
  showBack?: boolean,
  position?: ComponentProps<typeof AppBar>['position'],
  color?: ComponentProps<typeof AppBar>['color'],
}> = ({ title, showBack = true, position = 'static', color = 'primary' }) => {
  const classes = useStyles({ color });
  const history = useHistory()

  return (
    <AppBar position={position} elevation={0} color={color}>
      <Toolbar>
        {showBack && (
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            onClick={() => {
              history.goBack()
            }}
          >
            <ArrowBackIosRounded />
          </IconButton>
        )}
        <Typography variant="h6" className={classes.title}>
          {title}
        </Typography>
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
      marginRight: theme.spacing(2),
      color: ({ color }: Props) => color === 'transparent' ? 'white' : 'inherit',
    },
    title: {
      flexGrow: 1,
    },
  })
});