import React, { FC } from 'react';
import { Backdrop, CircularProgress, createStyles, makeStyles, useTheme } from "@material-ui/core"
import { useIsOpened } from './apollo-link-blocking/useIsOpened';

export const BlockingBackdrop: FC<{}> = () => {
  const classes = useStyles();
  const open = useIsOpened()
  const theme = useTheme()

  return (
    <Backdrop className={classes.backdrop} open={open} style={{ zIndex: theme.zIndex.tooltip + 1 }}>
      <CircularProgress color="inherit" />
    </Backdrop>
  )
}

const useStyles = makeStyles((theme) =>
  createStyles({
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff',
    },
  }),
);