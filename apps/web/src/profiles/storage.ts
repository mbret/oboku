import { createLocalStorageAdapter, useSignalValue } from "reactjrx"
import { activeProfileIdSignal } from "./active/activeProfileId"
import { useEffect, useState } from "react"

export const useProfileStorage = () => {
  const currentProfile = useSignalValue(activeProfileIdSignal)
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
