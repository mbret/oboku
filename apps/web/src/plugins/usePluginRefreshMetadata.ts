import {
  assertNever,
  type DataSourceDocType,
  type ProviderApiCredentials,
} from "@oboku/shared"
import { useCallback } from "react"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import type {
  UseRefreshMetadataRequest,
  UseRefreshMetadataVariables,
} from "./types"
import { pluginsByType } from "./configure"

type RefreshMetadataResult = {
  providerCredentials: ProviderApiCredentials<DataSourceDocType["type"]>
}

export const usePluginRefreshMetadata = () => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()

  const { mutateAsync: refreshWebdavMetadata } =
    pluginsByType.webdav.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({ name: "webdav" }),
    })
  const { mutateAsync: refreshSynologyDriveMetadata } = pluginsByType[
    "synology-drive"
  ].useRefreshMetadata({
    requestPopup: createRequestPopupDialog({ name: "synology-drive" }),
  })
  const { mutateAsync: refreshDropboxMetadata } =
    pluginsByType.dropbox.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({ name: "dropbox" }),
    })
  const { mutateAsync: refreshDriveMetadata } =
    pluginsByType.DRIVE.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({ name: "DRIVE" }),
    })
  const { mutateAsync: refreshOneDriveMetadata } = pluginsByType[
    "one-drive"
  ].useRefreshMetadata({
    requestPopup: createRequestPopupDialog({ name: "one-drive" }),
  })
  const { mutateAsync: refreshFileMetadata } =
    pluginsByType.file.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({ name: "file" }),
    })
  const { mutateAsync: refreshUriMetadata } =
    pluginsByType.URI.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({ name: "URI" }),
    })
  const { mutateAsync: refreshServerMetadata } =
    pluginsByType.server.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({ name: "server" }),
    })

  return useCallback(
    async (
      params: UseRefreshMetadataRequest,
    ): Promise<RefreshMetadataResult> => {
      switch (params.linkType) {
        case "webdav":
          // The switch routes by linkType first, so this narrows the broader
          // request shape back to the provider-specific hook input.
          return refreshWebdavMetadata(
            params as UseRefreshMetadataVariables<"webdav">,
          )
        case "synology-drive":
          return refreshSynologyDriveMetadata(
            params as UseRefreshMetadataVariables<"synology-drive">,
          )
        case "dropbox":
          return refreshDropboxMetadata(
            params as UseRefreshMetadataVariables<"dropbox">,
          )
        case "DRIVE":
          return refreshDriveMetadata(
            params as UseRefreshMetadataVariables<"DRIVE">,
          )
        case "one-drive":
          return refreshOneDriveMetadata(
            params as UseRefreshMetadataVariables<"one-drive">,
          )
        case "file":
          return refreshFileMetadata(
            params as UseRefreshMetadataVariables<"file">,
          )
        case "URI":
          return refreshUriMetadata(
            params as UseRefreshMetadataVariables<"URI">,
          )
        case "server":
          return refreshServerMetadata(
            params as UseRefreshMetadataVariables<"server">,
          )
        default:
          return assertNever(params.linkType)
      }
    },
    [
      refreshDriveMetadata,
      refreshDropboxMetadata,
      refreshFileMetadata,
      refreshOneDriveMetadata,
      refreshServerMetadata,
      refreshSynologyDriveMetadata,
      refreshUriMetadata,
      refreshWebdavMetadata,
    ],
  )
}
