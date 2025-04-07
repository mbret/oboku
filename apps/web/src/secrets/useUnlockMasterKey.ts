import { useCallback, useEffect, useState } from "react"
import { useRequestMasterKey } from "./useRequestMasterKey"

// const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000

export const useUnlockMasterKey = () => {
  const { mutate: requestMasterKey } = useRequestMasterKey()
  const [masterKey, setMasterKey] = useState<string | undefined>(undefined)

  useEffect(() => {
    return () => {
      setMasterKey(undefined)
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
      },
    })
  }, [requestMasterKey])

  const clearMasterKey = useCallback(() => {
    setMasterKey(undefined)
  }, [])

  return { masterKey, unlockMasterKey, clearMasterKey }
}
