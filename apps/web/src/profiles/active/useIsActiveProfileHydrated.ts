import { useSignalValue } from "reactjrx"
import { useAuthSession } from "../../auth/authSession"
import { activeProfileSignal } from "./activeProfile"

export const useIsActiveProfileHydrated = () => {
  const activeProfileId = useSignalValue(activeProfileSignal)
  const { isFetched } = useAuthSession()

  return !activeProfileId || isFetched
}
