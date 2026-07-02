import { useAuthSession } from "../auth/authSession"
import { useActiveProfileId } from "./activeProfile"

export const useIsProfileHydrated = () => {
  const activeProfileId = useActiveProfileId()
  const { isFetched } = useAuthSession()

  return !activeProfileId || isFetched
}
