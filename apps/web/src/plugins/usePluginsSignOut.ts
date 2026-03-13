import { pluginsByType } from "./configure"

export const usePluginsSignOut = () => {
  const dropboxSignOut = pluginsByType.dropbox.useSignOut()
  const driveSignOut = pluginsByType.DRIVE.useSignOut()
  const uriSignOut = pluginsByType.URI.useSignOut()
  const fileSignOut = pluginsByType.file.useSignOut()
  const synologyDriveSignOut = pluginsByType["synology-drive"].useSignOut()
  const webdavSignOut = pluginsByType.webdav.useSignOut()

  const signOutByPlugin: {
    [K in keyof typeof pluginsByType]: () => void
  } = {
    dropbox: dropboxSignOut,
    DRIVE: driveSignOut,
    URI: uriSignOut,
    file: fileSignOut,
    "synology-drive": synologyDriveSignOut,
    webdav: webdavSignOut,
  }

  return () => {
    Object.values(signOutByPlugin).forEach((signOut) => {
      signOut()
    })
  }
}
