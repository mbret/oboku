import type { DataSourceDocType, ProviderApiCredentials } from "@oboku/shared"
import { useCallback } from "react"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import type { UseRefreshMetadataRequest } from "./types"
import { getPluginFromType } from "./getPluginFromType"

function assertNever(value: never): never {
  throw new Error(`Unexpected linkType: ${String(value)}`)
}

export const usePluginRefreshMetadata = () => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()

  const { mutateAsync: webdavRefreshMetadata } = getPluginFromType(
    "webdav",
  )?.useRefreshMetadata?.({
    requestPopup: createRequestPopupDialog({ name: "webdav" }),
  }) ?? {
    mutateAsync: async () => {
      throw new Error("WebDAV plugin not found")
    },
  }

  const { mutateAsync: synologyDriveRefreshMetadata } = getPluginFromType(
    "synology-drive",
  )?.useRefreshMetadata?.({
    requestPopup: createRequestPopupDialog({ name: "synology-drive" }),
  }) ?? {
    mutateAsync: async () => {
      throw new Error("Synology Drive plugin not found")
    },
  }

  const { mutateAsync: dropboxRefreshMetadata } = getPluginFromType(
    "dropbox",
  )?.useRefreshMetadata?.({
    requestPopup: createRequestPopupDialog({ name: "dropbox" }),
  }) ?? {
    mutateAsync: async () => {
      throw new Error("Dropbox plugin not found")
    },
  }

  const { mutateAsync: driveRefreshMetadata } = getPluginFromType(
    "DRIVE",
  )?.useRefreshMetadata?.({
    requestPopup: createRequestPopupDialog({ name: "DRIVE" }),
  }) ?? {
    mutateAsync: async () => {
      throw new Error("Drive plugin not found")
    },
  }

  const { mutateAsync: fileRefreshMetadata } = getPluginFromType(
    "file",
  )?.useRefreshMetadata?.({
    requestPopup: createRequestPopupDialog({ name: "file" }),
  }) ?? {
    mutateAsync: async () => {
      throw new Error("File plugin not found")
    },
  }

  const { mutateAsync: uriRefreshMetadata } = getPluginFromType(
    "URI",
  )?.useRefreshMetadata?.({
    requestPopup: createRequestPopupDialog({ name: "URI" }),
  }) ?? {
    mutateAsync: async () => {
      throw new Error("URI plugin not found")
    },
  }

  return useCallback(
    async (
      params: UseRefreshMetadataRequest,
    ): Promise<{
      providerCredentials: ProviderApiCredentials<DataSourceDocType["type"]>
    }> => {
      const linkType = params.linkType

      switch (linkType) {
        case "webdav":
          return await webdavRefreshMetadata(params)
        case "synology-drive":
          return await synologyDriveRefreshMetadata(params)
        case "dropbox":
          return await dropboxRefreshMetadata(params)
        case "DRIVE":
          return await driveRefreshMetadata(params)
        case "file":
          return await fileRefreshMetadata(params)
        case "URI":
          return await uriRefreshMetadata(params)
        default:
          return assertNever(linkType)
      }
    },
    [
      webdavRefreshMetadata,
      synologyDriveRefreshMetadata,
      dropboxRefreshMetadata,
      driveRefreshMetadata,
      fileRefreshMetadata,
      uriRefreshMetadata,
    ],
  )
}
