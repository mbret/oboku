import React, { FC, useEffect, useState } from 'react';
import { Backdrop, CircularProgress, createStyles, makeStyles, useTheme } from "@material-ui/core"
import { useRecoilValue } from 'recoil';

import { atom, selector, useRecoilState } from "recoil";

type Key = 'authorize'

const lockState = atom<Key[]>({
  key: 'lock',
  default: [],
})

export const isLockedState = selector({
  key: 'isLockedState',
  get: ({ get }) => !!get(lockState).length
});

export const useLock = () => {
  const [, setLock] = useRecoilState(lockState)
  const lock = (key: Key) => {
    setLock(old => [...old, key])
  }

  const unlock = (key: Key) => {
    setLock(old => {
      const index = old.findIndex(k => k === key)

      return [...old.slice(0, index), ...old.slice(index + 1)];
    })
  }

  return [lock, unlock] as [typeof lock, typeof unlock]
}

export const BlockingBackdrop: FC<{}> = () => {
  const classes = useStyles();
  const open = useRecoilValue(isLockedState)
  const [active, setActive] = useState(false)
  const theme = useTheme()

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    let alreadyOverdue = false
    if (open) {
      setActive(true)
      setTimeout(() => {
        alreadyOverdue = true
      }, 300)
    } else {
      if (alreadyOverdue) {
        setActive(false)
      } else {
        timeout = setTimeout(() => {
          setActive(false)
        }, 300)
      }
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [open])

  return (
    <Backdrop className={classes.backdrop} open={active} style={{ zIndex: theme.zIndex.tooltip + 1 }}>
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