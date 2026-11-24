import {
  assertNever,
  type LibrarySyncDocType,
  type SourceApiCredentials,
} from "@oboku/shared"
import { useCallback } from "react"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import { pluginsByType } from "./configure"

type SynchronizeResult = {
  providerCredentials: SourceApiCredentials<LibrarySyncDocType["type"]>
}

/**
 * Calls each plugin's `useSynchronize` by name. Plugin members named `use*` are
 * hooks on purpose (see `SourcePlugin`), and hooks cannot run in a loop, so a
 * new plugin adds its line here.
 */
export const usePluginSynchronize = () => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()
  const { mutateAsync: synchronizeWebdav } =
    pluginsByType.webdav.useSynchronize({
      requestPopup: createRequestPopupDialog({
        name: pluginsByType.webdav.name,
      }),
    })
  const { mutateAsync: synchronizeDropbox } =
    pluginsByType.dropbox.useSynchronize({
      requestPopup: createRequestPopupDialog({
        name: pluginsByType.dropbox.name,
      }),
    })
  const { mutateAsync: synchronizeSynologyDrive } = pluginsByType[
    "synology-drive"
  ].useSynchronize({
    requestPopup: createRequestPopupDialog({
      name: pluginsByType["synology-drive"].name,
    }),
  })
  const { mutateAsync: synchronizeDrive } = pluginsByType.DRIVE.useSynchronize({
    requestPopup: createRequestPopupDialog({ name: pluginsByType.DRIVE.name }),
  })
  const { mutateAsync: synchronizeOneDrive } = pluginsByType[
    "one-drive"
  ].useSynchronize({
    requestPopup: createRequestPopupDialog({
      name: pluginsByType["one-drive"].name,
    }),
  })
  const { mutateAsync: synchronizeFile } = pluginsByType.file.useSynchronize({
    requestPopup: createRequestPopupDialog({ name: pluginsByType.file.name }),
  })
  const { mutateAsync: synchronizeUri } = pluginsByType.URI.useSynchronize({
    requestPopup: createRequestPopupDialog({ name: pluginsByType.URI.name }),
  })
  const { mutateAsync: synchronizeServer } =
    pluginsByType.server.useSynchronize({
      requestPopup: createRequestPopupDialog({
        name: pluginsByType.server.name,
      }),
    })
  const { mutateAsync: synchronizeOpds } = pluginsByType.opds.useSynchronize({
    requestPopup: createRequestPopupDialog({ name: pluginsByType.opds.name }),
  })

  return useCallback(
    async (librarySync: LibrarySyncDocType): Promise<SynchronizeResult> => {
      switch (librarySync.type) {
        case "webdav":
          return synchronizeWebdav(librarySync)
        case "dropbox":
          return synchronizeDropbox(librarySync)
        case "synology-drive":
          return synchronizeSynologyDrive(librarySync)
        case "DRIVE":
          return synchronizeDrive(librarySync)
        case "one-drive":
          return synchronizeOneDrive(librarySync)
        case "file":
          return synchronizeFile(librarySync)
        case "URI":
          return synchronizeUri(librarySync)
        case "server":
          return synchronizeServer(librarySync)
        case "opds":
          return synchronizeOpds(librarySync)
        default:
          return assertNever(librarySync)
      }
    },
    [
      synchronizeDrive,
      synchronizeDropbox,
      synchronizeFile,
      synchronizeOneDrive,
      synchronizeOpds,
      synchronizeServer,
      synchronizeSynologyDrive,
      synchronizeUri,
      synchronizeWebdav,
    ],
  )
}
