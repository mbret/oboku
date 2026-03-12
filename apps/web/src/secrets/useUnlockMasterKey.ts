import { useCallback, useEffect } from "react"
import { useRequestMasterKey } from "./useRequestMasterKey"
import { BehaviorSubject } from "rxjs"
import { useObserve } from "reactjrx"
import type { MutateOptions } from "@tanstack/react-query"

// const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000

const unlockedMasterKeySubject = new BehaviorSubject<string | undefined>(
  undefined,
)

export const useUnlockMasterKey = () => {
  const {
    mutate: requestMasterKey,
    data: masterKey,
    reset: resetMasterKey,
  } = useRequestMasterKey()

  useEffect(() => {
    return () => {
      resetMasterKey()
      unlockedMasterKeySubject.next(undefined)
    }
  }, [resetMasterKey])

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

  const unlockMasterKey = useCallback(
    (
      _variables?: unknown,
      options?: MutateOptions<string, Error, void, unknown>,
    ) => {
      requestMasterKey(undefined, {
        ...options,
        onSuccess: (masterKey, ...rest) => {
          unlockedMasterKeySubject.next(masterKey)
          options?.onSuccess?.(masterKey, ...rest)
        },
      })
    },
    [requestMasterKey],
  )

  const clearMasterKey = useCallback(() => {
    resetMasterKey()
    unlockedMasterKeySubject.next(undefined)
  }, [resetMasterKey])

  return { masterKey, unlockMasterKey, clearMasterKey }
}

export const useUnlockedMasterKey = () => {
  return useObserve(unlockedMasterKeySubject)
}
