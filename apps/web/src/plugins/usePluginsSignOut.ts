import { Logger } from "../debug/logger.shared"
import { pluginsByType } from "./configure"

export const usePluginsSignOut = () => {
  const dropboxSignOut = pluginsByType.dropbox.useSignOut()
  const driveSignOut = pluginsByType.DRIVE.useSignOut()
  const oneDriveSignOut = pluginsByType["one-drive"].useSignOut()
  const uriSignOut = pluginsByType.URI.useSignOut()
  const fileSignOut = pluginsByType.file.useSignOut()
  const synologyDriveSignOut = pluginsByType["synology-drive"].useSignOut()
  const webdavSignOut = pluginsByType.webdav.useSignOut()
  const serverSignOut = pluginsByType.server.useSignOut()
  const opdsSignOut = pluginsByType.opds.useSignOut()

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
    opds: opdsSignOut,
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
