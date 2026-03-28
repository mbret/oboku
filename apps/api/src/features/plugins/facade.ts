import type {
  DataSourceType,
  LinkDocTypeForProvider,
  LinkWithCredentials,
  ProviderApiCredentials,
} from "@oboku/shared"
import type createNano from "nano"
import { getPlugin } from "./plugins"

type MetadataParams<T extends DataSourceType = DataSourceType> = {
  link: LinkWithCredentials<T>
  providerCredentials: ProviderApiCredentials<T>
  db?: createNano.DocumentScope<unknown>
}

type DownloadParams<T extends DataSourceType = DataSourceType> = {
  link: LinkDocTypeForProvider<T>
  providerCredentials: ProviderApiCredentials<T>
  db?: createNano.DocumentScope<unknown>
}

const getRequiredPlugin = <T extends DataSourceType>(type: T) => {
  const plugin = getPlugin(type)

  if (!plugin) {
    throw new Error("No dataSource found for action")
  }

  return plugin
}

export const pluginFacade = {
  getFolderMetadata: <T extends DataSourceType>(params: MetadataParams<T>) => {
    return getRequiredPlugin(params.link.type).getFolderMetadata(params)
  },
  getFileMetadata: <T extends DataSourceType>(params: MetadataParams<T>) => {
    return getRequiredPlugin(params.link.type).getFileMetadata(params)
  },
  download: async <T extends DataSourceType>(params: DownloadParams<T>) => {
    return getRequiredPlugin(params.link.type).download(
      params.link,
      params.providerCredentials,
      params.db,
    )
  },
}
