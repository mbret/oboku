import { useActiveProfile } from "../profiles"

export const useHasAuthentication = () => {
  const { data: auth } = useActiveProfile()

  return !!auth
}
