import { FC, useCallback, useEffect, useState } from "react"
import { Backdrop, CircularProgress, useTheme } from "@mui/material"
import { signal, useSignalValue } from "reactjrx"
import { ObservedValueOf, Subject } from "rxjs"

type Key = string

const lockState = signal<Key[]>({
  key: "lock",
  default: []
})

export const useIsLockedState = () => {
  return !!useSignalValue(lockState).length
}

const lockSubject = new Subject<string>()

export const lock$ = lockSubject.asObservable()

export const lock = (options: ObservedValueOf<typeof lockSubject>) =>
  lockSubject.next(options)

const unlockSubject = new Subject<string>()

export const unlock$ = unlockSubject.asObservable()

export const unlock = (options: ObservedValueOf<typeof unlockSubject>) =>
  unlockSubject.next(options)

export const useLock = () => {
  const unlock = useCallback((key: Key) => {
    lockState.setValue((old) => {
      const index = old.findIndex((k) => k === key)

      return [...old.slice(0, index), ...old.slice(index + 1)]
    })
  }, [])

  const lock = useCallback(
    (key: Key = Date.now().toString()) => {
      lockState.setValue((old) => [...old, key])

      return () => unlock(key)
    },
    [unlock]
  )

  return [lock, unlock] as [typeof lock, typeof unlock]
}

export const BlockingBackdrop: FC<{}> = () => {
  const open = useIsLockedState()
  const [active, setActive] = useState(false)
  const theme = useTheme()
  const [lock, unlock] = useLock()

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

  useEffect(() => {
    const lockSub = lock$.subscribe((v) => lock(v))
    const unlockSub = unlock$.subscribe((v) => unlock(v))

    return () => {
      lockSub.unsubscribe()
      unlockSub.unsubscribe()
    }
  }, [lock, unlock])

  return (
    <Backdrop
      open={active}
      sx={{
        zIndex: theme.zIndex.tooltip + 1,
        color: "#fff"
      }}
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
