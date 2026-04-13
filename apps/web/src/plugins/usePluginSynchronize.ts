import {
  assertNever,
  type DataSourceDocType,
  type ProviderApiCredentials,
} from "@oboku/shared"
import { useCallback } from "react"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import { pluginsByType } from "./configure"

type SynchronizeResult = {
  providerCredentials: ProviderApiCredentials<DataSourceDocType["type"]>
}

export const usePluginSynchronize = () => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()
  const { mutateAsync: synchronizeWebdav } =
    pluginsByType.webdav.useSynchronize({
      requestPopup: createRequestPopupDialog({ name: "webdav" }),
    })
  const { mutateAsync: synchronizeDropbox } =
    pluginsByType.dropbox.useSynchronize({
      requestPopup: createRequestPopupDialog({ name: "dropbox" }),
    })
  const { mutateAsync: synchronizeSynologyDrive } = pluginsByType[
    "synology-drive"
  ].useSynchronize({
    requestPopup: createRequestPopupDialog({ name: "synology-drive" }),
  })
  const { mutateAsync: synchronizeDrive } = pluginsByType.DRIVE.useSynchronize({
    requestPopup: createRequestPopupDialog({ name: "DRIVE" }),
  })
  const { mutateAsync: synchronizeOneDrive } = pluginsByType[
    "one-drive"
  ].useSynchronize({
    requestPopup: createRequestPopupDialog({ name: "one-drive" }),
  })
  const { mutateAsync: synchronizeFile } = pluginsByType.file.useSynchronize({
    requestPopup: createRequestPopupDialog({ name: "file" }),
  })
  const { mutateAsync: synchronizeUri } = pluginsByType.URI.useSynchronize({
    requestPopup: createRequestPopupDialog({ name: "URI" }),
  })
  const { mutateAsync: synchronizeServer } =
    pluginsByType.server.useSynchronize({
      requestPopup: createRequestPopupDialog({ name: "server" }),
    })

  return useCallback(
    async (dataSource: DataSourceDocType): Promise<SynchronizeResult> => {
      switch (dataSource.type) {
        case "webdav":
          return synchronizeWebdav(dataSource)
        case "dropbox":
          return synchronizeDropbox(dataSource)
        case "synology-drive":
          return synchronizeSynologyDrive(dataSource)
        case "DRIVE":
          return synchronizeDrive(dataSource)
        case "one-drive":
          return synchronizeOneDrive(dataSource)
        case "file":
          return synchronizeFile(dataSource)
        case "URI":
          return synchronizeUri(dataSource)
        case "server":
          return synchronizeServer(dataSource)
        default:
          return assertNever(dataSource)
      }
    },
    [
      synchronizeDrive,
      synchronizeDropbox,
      synchronizeFile,
      synchronizeOneDrive,
      synchronizeServer,
      synchronizeSynologyDrive,
      synchronizeUri,
      synchronizeWebdav,
    ],
  )
}
