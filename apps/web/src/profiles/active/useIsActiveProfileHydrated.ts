import { useActiveProfileId } from "./activeProfileId"
import { useActiveProfile } from "./useActiveProfile"

export const useIsActiveProfileHydrated = () => {
  const activeProfileId = useActiveProfileId()
  const { isFetched } = useActiveProfile()

  return !activeProfileId || isFetched
}
