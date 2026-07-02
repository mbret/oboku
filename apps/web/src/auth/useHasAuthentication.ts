import { useAuthSession } from "./authSession"

export const useHasAuthentication = () => {
  const { data: auth } = useAuthSession()

  return !!auth
}
