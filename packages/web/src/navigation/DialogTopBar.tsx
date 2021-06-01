import { FC, memo } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import { ArrowBackIosRounded, CloseRounded } from '@material-ui/icons';
import { useCSS } from '../common/utils';

export const DialogTopBar: FC<{
  title?: string,
  onClose: () => void,
  hasBackNavigation?: boolean
}> = memo(({ title, onClose, hasBackNavigation = false }) => {
  const { styles } = useStyles();

  return (
    <AppBar position="static" elevation={0} color="transparent">
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
          {hasBackNavigation ? <ArrowBackIosRounded /> : <CloseRounded />}

        </IconButton>
        <Typography variant="h6" style={styles.title} noWrap>
          {title}
        </Typography>
      </Toolbar>
    </AppBar >
  );
})

const useStyles = () => {
  const styles = useCSS(() => ({
    title: {
      flexGrow: 1,
    },
  }), [])

  return { styles }
}