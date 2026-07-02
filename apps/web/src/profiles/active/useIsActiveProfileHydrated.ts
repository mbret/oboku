import { useSignalValue } from "reactjrx"
import { activeProfileIdSignal } from "./activeProfileId"
import { useActiveProfile } from "./useActiveProfile"

export const useIsActiveProfileHydrated = () => {
  const activeProfileId = useSignalValue(activeProfileIdSignal)
  const { isFetched } = useActiveProfile()

  return !activeProfileId || isFetched
}
