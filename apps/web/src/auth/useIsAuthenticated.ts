import { useActiveProfile } from "../profiles"

export const useIsAuthenticated = () => {
  const { data: auth } = useActiveProfile()

  return !!auth && !auth.needsRelogin
}
