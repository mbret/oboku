import { useCallback, useEffect, useState } from "react"
import { useRequestMasterKey } from "./useRequestMasterKey"
import { BehaviorSubject } from "rxjs"
import { useObserve } from "reactjrx"

// const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000

const unlockedMasterKeySubject = new BehaviorSubject<string | undefined>(
  undefined,
)

export const useUnlockMasterKey = () => {
  const { mutate: requestMasterKey } = useRequestMasterKey()
  const [masterKey, setMasterKey] = useState<string | undefined>(undefined)

  useEffect(() => {
    return () => {
      setMasterKey(undefined)
      unlockedMasterKeySubject.next(undefined)
    }
  }, [])

  //   useEffect(() => {
  //     if (masterKey) {
  //       const timeout = setTimeout(() => {
  //         setMasterKey(undefined)
  //       }, DEFAULT_TIMEOUT_MS)

  //       return () => {
  //         clearTimeout(timeout)
  //       }
  //     }
  //   }, [masterKey])

  const unlockMasterKey = useCallback(() => {
    requestMasterKey(undefined, {
      onSuccess: (masterKey) => {
        setMasterKey(masterKey)
        unlockedMasterKeySubject.next(masterKey)
      },
    })
  }, [requestMasterKey])

  const clearMasterKey = useCallback(() => {
    setMasterKey(undefined)
    unlockedMasterKeySubject.next(undefined)
  }, [])

  return { masterKey, unlockMasterKey, clearMasterKey }
}

export const useUnlockedMasterKey = () => {
  return useObserve(unlockedMasterKeySubject)
}
