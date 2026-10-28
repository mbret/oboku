import {
  assertNever,
  type DataSourceDocType,
  type ProviderApiCredentials,
} from "@oboku/shared"
import type { UseMutationOptions } from "@tanstack/react-query"
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

export const usePluginRefreshMetadata = (
  options?: Pick<UseMutationOptions, "meta">,
) => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()
  const meta = options?.meta

  const { mutateAsync: refreshWebdavMetadata } =
    pluginsByType.webdav.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({
        name: pluginsByType.webdav.name,
      }),
      meta,
    })
  const { mutateAsync: refreshSynologyDriveMetadata } = pluginsByType[
    "synology-drive"
  ].useRefreshMetadata({
    requestPopup: createRequestPopupDialog({
      name: pluginsByType["synology-drive"].name,
    }),
    meta,
  })
  const { mutateAsync: refreshDropboxMetadata } =
    pluginsByType.dropbox.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({
        name: pluginsByType.dropbox.name,
      }),
      meta,
    })
  const { mutateAsync: refreshDriveMetadata } =
    pluginsByType.DRIVE.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({
        name: pluginsByType.DRIVE.name,
      }),
      meta,
    })
  const { mutateAsync: refreshOneDriveMetadata } = pluginsByType[
    "one-drive"
  ].useRefreshMetadata({
    requestPopup: createRequestPopupDialog({
      name: pluginsByType["one-drive"].name,
    }),
    meta,
  })
  const { mutateAsync: refreshFileMetadata } =
    pluginsByType.file.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({ name: pluginsByType.file.name }),
      meta,
    })
  const { mutateAsync: refreshUriMetadata } =
    pluginsByType.URI.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({ name: pluginsByType.URI.name }),
      meta,
    })
  const { mutateAsync: refreshServerMetadata } =
    pluginsByType.server.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({
        name: pluginsByType.server.name,
      }),
      meta,
    })
  const { mutateAsync: refreshOpdsMetadata } =
    pluginsByType.opds.useRefreshMetadata({
      requestPopup: createRequestPopupDialog({
        name: pluginsByType.opds.name,
      }),
      meta,
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
        case "opds":
          return refreshOpdsMetadata(
            params as UseRefreshMetadataVariables<"opds">,
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
      refreshOpdsMetadata,
      refreshServerMetadata,
      refreshSynologyDriveMetadata,
      refreshUriMetadata,
      refreshWebdavMetadata,
    ],
  )
}
