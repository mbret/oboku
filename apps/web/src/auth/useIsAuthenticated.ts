import { useAuthSession } from "./authSession"

export const useIsAuthenticated = () => {
  const { data: auth } = useAuthSession()

  return !!auth && !auth.needsRelogin
}
