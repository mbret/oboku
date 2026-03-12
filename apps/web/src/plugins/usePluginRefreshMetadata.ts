import type { DataSourceDocType, ProviderApiCredentials } from "@oboku/shared"
import { useCallback } from "react"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import type { UseRefreshMetadataRequest } from "./types"
import { getPluginFromType } from "./getPluginFromType"

function assertNever(value: never): never {
  throw new Error(`Unexpected linkType: ${String(value)}`)
}

const getRequiredPlugin = (type: UseRefreshMetadataRequest["linkType"]) => {
  const plugin = getPluginFromType(type)

  if (!plugin) {
    throw new Error(`Plugin ${type} not found`)
  }

  return plugin
}

export const usePluginRefreshMetadata = () => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()

  const { mutateAsync: webdavRefreshMetadata } = getRequiredPlugin(
    "webdav",
  ).useRefreshMetadata({
    requestPopup: createRequestPopupDialog({ name: "webdav" }),
  })

  const { mutateAsync: synologyDriveRefreshMetadata } = getRequiredPlugin(
    "synology-drive",
  ).useRefreshMetadata({
    requestPopup: createRequestPopupDialog({ name: "synology-drive" }),
  })

  const { mutateAsync: dropboxRefreshMetadata } = getRequiredPlugin(
    "dropbox",
  ).useRefreshMetadata({
    requestPopup: createRequestPopupDialog({ name: "dropbox" }),
  })

  const { mutateAsync: driveRefreshMetadata } = getRequiredPlugin(
    "DRIVE",
  ).useRefreshMetadata({
    requestPopup: createRequestPopupDialog({ name: "DRIVE" }),
  })

  const { mutateAsync: fileRefreshMetadata } = getRequiredPlugin(
    "file",
  ).useRefreshMetadata({
    requestPopup: createRequestPopupDialog({ name: "file" }),
  })

  const { mutateAsync: uriRefreshMetadata } = getRequiredPlugin(
    "URI",
  ).useRefreshMetadata({
    requestPopup: createRequestPopupDialog({ name: "URI" }),
  })

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
