import { signOutPlugins } from "../plugins/signOutPlugins"
import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"

/**
 * Forgets the temporary master key and every plugin session. Call it before
 * the active profile id moves to another account or to none, so nothing reads
 * the next account with the previous one's sessions.
 */
export const forgetAccountSessions = () => {
  clearTemporaryMasterKey()
  signOutPlugins()
}
