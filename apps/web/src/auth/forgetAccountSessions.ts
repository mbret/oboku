import { Logger } from "../debug/logger.shared"
import { plugins } from "../plugins/configure"
import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"

/**
 * Call it when the active profile id moves to another account or to none,
 * before anything renders for the next account. It never throws: a plugin
 * whose `signOut` throws is logged, and the other plugins still sign out.
 */
export const forgetAccountSessions = () => {
  clearTemporaryMasterKey()

  plugins.forEach(function signOutPlugin(plugin) {
    try {
      plugin.signOut?.()
    } catch (error) {
      Logger.error(`Failed to sign out of ${plugin.name}`, error)
    }
  })
}
