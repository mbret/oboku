import { Logger } from "../../debug/logger.shared"
import { plugins } from "./configure"

export function signOutPlugins() {
  plugins.forEach(function signOutPlugin(plugin) {
    try {
      plugin.signOut()
    } catch (error) {
      Logger.error(`Failed to sign out of the ${plugin.type} plugin`, error)
    }
  })
}
