import { createLocalStorageAdapter, useSignalValue } from "reactjrx"
import { activeProfileSignal } from "./active/activeProfile"
import { useEffect, useState } from "react"

export const useProfileStorage = () => {
  const currentProfile = useSignalValue(activeProfileSignal)
  const [storage, setStorage] = useState<
    ReturnType<typeof createLocalStorageAdapter> | undefined
  >(undefined)

  useEffect(() => {
    if (currentProfile) {
      setStorage(
        createLocalStorageAdapter({
          key: `profile-${currentProfile}`,
        }),
      )

      return () => {
        setStorage(undefined)
      }
    }
  }, [currentProfile])

  return storage
}
