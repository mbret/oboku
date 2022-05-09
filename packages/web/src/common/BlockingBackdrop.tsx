import React, { FC, useEffect, useState } from "react"
import { Backdrop, CircularProgress, useTheme } from "@mui/material"
import { useRecoilCallback, useRecoilValue } from "recoil"
import { atom, selector } from "recoil"
import { useCSS } from "../common/utils"

type Key = string

const lockState = atom<Key[]>({
  key: "lock",
  default: []
})

export const isLockedState = selector({
  key: "isLockedState",
  get: ({ get }) => !!get(lockState).length
})

export const useLock = () => {
  const unlock = useRecoilCallback(
    ({ set }) =>
      (key: Key) => {
        set(lockState, (old) => {
          const index = old.findIndex((k) => k === key)

          return [...old.slice(0, index), ...old.slice(index + 1)]
        })
      },
    []
  )

  const lock = useRecoilCallback(
    ({ set }) =>
      (key: Key = Date.now().toString()) => {
        set(lockState, (old) => [...old, key])

        return () => unlock(key)
      },
    []
  )

  return [lock, unlock] as [typeof lock, typeof unlock]
}

export const BlockingBackdrop: FC<{}> = () => {
  const classes = useStyles()
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
    <Backdrop
      open={active}
      style={{ ...classes.backdrop, zIndex: theme.zIndex.tooltip + 1 }}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  )
}

export const BlockingScreen = () => {
  const [lock] = useLock()

  useEffect(() => {
    const unlock = lock()
    return () => unlock()
  }, [lock])

  return null
}

const useStyles = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      backdrop: {
        zIndex: theme.zIndex.drawer + 1,
        color: "#fff"
      }
    }),
    [theme]
  )
}
