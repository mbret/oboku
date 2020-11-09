import React, { FC } from 'react';
import { Backdrop, CircularProgress, createStyles, makeStyles } from "@material-ui/core"
import { useIsOpened } from './apollo-link-blocking/useIsOpened';

export const BlockingBackdrop: FC<{}> = () => {
  const classes = useStyles();
  const open = useIsOpened()

  return (
    <Backdrop className={classes.backdrop} open={open} >
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