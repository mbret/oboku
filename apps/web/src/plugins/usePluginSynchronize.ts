import type { DataSourceDocType, ProviderApiCredentials } from "@oboku/shared"
import { useCallback } from "react"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import { getPluginFromType } from "./getPluginFromType"

function assertNever(value: never): never {
  throw new Error(`Unexpected dataSource type: ${String(value)}`)
}

export const usePluginSynchronize = () => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()

  const { mutateAsync: webdavSynchronize } = getPluginFromType(
    "webdav",
  )?.useSynchronize?.({
    requestPopup: createRequestPopupDialog({ name: "webdav" }),
  }) ?? {
    mutateAsync: async () => {
      throw new Error("WebDAV plugin not found")
    },
  }

  const { mutateAsync: dropboxSynchronize } = getPluginFromType(
    "dropbox",
  )?.useSynchronize?.({
    requestPopup: createRequestPopupDialog({ name: "dropbox" }),
  }) ?? {
    mutateAsync: async () => {
      throw new Error("Dropbox plugin not found")
    },
  }

  const { mutateAsync: driveSynchronize } = getPluginFromType(
    "DRIVE",
  )?.useSynchronize?.({
    requestPopup: createRequestPopupDialog({ name: "DRIVE" }),
  }) ?? {
    mutateAsync: async () => {
      throw new Error("Drive plugin not found")
    },
  }

  return useCallback(
    async (
      dataSource: DataSourceDocType,
    ): Promise<{
      providerCredentials: ProviderApiCredentials<DataSourceDocType["type"]>
    }> => {
      switch (dataSource.type) {
        case "webdav":
          return await webdavSynchronize(dataSource)
        case "dropbox":
          return await dropboxSynchronize(dataSource)
        case "DRIVE":
          return await driveSynchronize(dataSource)
        case "synology-drive":
        case "file":
        case "URI":
          throw new Error("this datasource cannot synchronize")
        default:
          return assertNever(dataSource)
      }
    },
    [webdavSynchronize, dropboxSynchronize, driveSynchronize],
  )
}
