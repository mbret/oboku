import { Logger } from "../../debug/logger.shared"
import { pluginsByType } from "./configure"

/**
 * Calls each plugin's `useSignOut` by name. The plugin member is a hook on
 * purpose, and hooks cannot run in a loop, so a new plugin adds its line here.
 */
export const usePluginsSignOut = () => {
  const dropboxSignOut = pluginsByType.dropbox.useSignOut()
  const driveSignOut = pluginsByType.DRIVE.useSignOut()
  const oneDriveSignOut = pluginsByType["one-drive"].useSignOut()
  const uriSignOut = pluginsByType.URI.useSignOut()
  const fileSignOut = pluginsByType.file.useSignOut()
  const synologyDriveSignOut = pluginsByType["synology-drive"].useSignOut()
  const webdavSignOut = pluginsByType.webdav.useSignOut()
  const serverSignOut = pluginsByType.server.useSignOut()

  const signOutByPlugin: {
    [K in keyof typeof pluginsByType]: () => void
  } = {
    dropbox: dropboxSignOut,
    DRIVE: driveSignOut,
    "one-drive": oneDriveSignOut,
    URI: uriSignOut,
    file: fileSignOut,
    "synology-drive": synologyDriveSignOut,
    webdav: webdavSignOut,
    server: serverSignOut,
  }

  return function signOutPlugins() {
    Object.entries(signOutByPlugin).forEach(function signOutPlugin([
      type,
      signOut,
    ]) {
      try {
        signOut()
      } catch (error) {
        Logger.error(`Failed to sign out of the ${type} plugin`, error)
      }
    })
  }
}
