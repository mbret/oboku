import type {
  DataSourceType,
  LinkDocTypeForProvider,
  LinkWithCredentials,
  ProviderApiCredentials,
} from "@oboku/shared"
import { parseProviderApiCredentials } from "@oboku/shared"
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
    const providerCredentials = parseProviderApiCredentials(
      params.link.type,
      params.providerCredentials,
    )

    return getRequiredPlugin(params.link.type).getFolderMetadata({
      ...params,
      providerCredentials,
    })
  },
  getFileMetadata: <T extends DataSourceType>(params: MetadataParams<T>) => {
    const providerCredentials = parseProviderApiCredentials(
      params.link.type,
      params.providerCredentials,
    )

    return getRequiredPlugin(params.link.type).getFileMetadata({
      ...params,
      providerCredentials,
    })
  },
  download: async <T extends DataSourceType>(params: DownloadParams<T>) => {
    const providerCredentials = parseProviderApiCredentials(
      params.link.type,
      params.providerCredentials,
    )

    return getRequiredPlugin(params.link.type).download(
      params.link,
      providerCredentials,
      params.db,
    )
  },
}
