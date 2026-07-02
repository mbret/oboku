import { useAuthSession } from "../../auth/authSession"
import { useActiveProfileId } from "./activeProfile"

export const useIsActiveProfileHydrated = () => {
  const activeProfileId = useActiveProfileId()
  const { isFetched } = useAuthSession()

  return !activeProfileId || isFetched
}
