import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"

/**
 * Returns the function that forgets the temporary master key and every
 * plugin's session. Call it when the active profile id moves to another
 * account or to none, before anything renders for the next account. It never
 * throws: a plugin whose sign-out throws is logged, and the others still sign
 * out.
 */
export const useForgetAccountSessions = () => {
  const signOutPlugins = usePluginsSignOut()

  return function forgetAccountSessions() {
    clearTemporaryMasterKey()
    signOutPlugins()
  }
}
