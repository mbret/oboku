import type {
  DataSourceType,
  LinkDocType,
  LinkDocTypeForProvider,
  LinkWithCredentials,
  ProviderApiCredentials,
} from "@oboku/shared"
import type createNano from "nano"
import { plugins } from "./plugins"
import type { PluginFacadeParams } from "./types"

const urlPlugin = plugins.URI

/** Narrowed metadata params union; facade narrows with type guard before calling plugin. */
type MetadataParamsUnion = {
  [K in DataSourceType]: {
    link: LinkWithCredentials<K>
    providerCredentials: ProviderApiCredentials<K>
    db?: createNano.DocumentScope<unknown>
  }
}[DataSourceType]

/** Narrowed download params union (full link doc per provider). */
type DownloadParamsUnion = {
  [K in DataSourceType]: {
    link: LinkDocTypeForProvider<K>
    providerCredentials: ProviderApiCredentials<K>
    db?: createNano.DocumentScope<unknown>
  }
}[DataSourceType]

type DownloadParams = {
  link: LinkDocType
  providerCredentials: ProviderApiCredentials<DataSourceType>
  db?: createNano.DocumentScope<unknown>
}

function isMetadataParamsFor<K extends DataSourceType>(
  params: PluginFacadeParams,
  type: K,
): params is Extract<MetadataParamsUnion, { link: LinkWithCredentials<K> }> {
  return params.link.type === type
}

function isDownloadParamsFor<K extends DataSourceType>(
  params: DownloadParams,
  type: K,
): params is Extract<DownloadParamsUnion, { link: LinkDocTypeForProvider<K> }> {
  return params.link.type === type
}

export const pluginFacade = {
  getFolderMetadata: (params: PluginFacadeParams) => {
    if (isMetadataParamsFor(params, "DRIVE"))
      return plugins.DRIVE.getFolderMetadata(params)
    if (isMetadataParamsFor(params, "dropbox"))
      return plugins.dropbox.getFolderMetadata(params)
    if (isMetadataParamsFor(params, "synology-drive"))
      return plugins["synology-drive"].getFolderMetadata(params)
    if (isMetadataParamsFor(params, "URI"))
      return urlPlugin.getFolderMetadata(params)
    if (isMetadataParamsFor(params, "webdav"))
      return plugins.webdav.getFolderMetadata(params)
    if (isMetadataParamsFor(params, "file"))
      return plugins.file.getFolderMetadata(params)
    throw new Error(`No dataSource found for action`)
  },
  getFileMetadata: (params: PluginFacadeParams) => {
    if (isMetadataParamsFor(params, "DRIVE"))
      return plugins.DRIVE.getFileMetadata(params)
    if (isMetadataParamsFor(params, "dropbox"))
      return plugins.dropbox.getFileMetadata(params)
    if (isMetadataParamsFor(params, "synology-drive"))
      return plugins["synology-drive"].getFileMetadata(params)
    if (isMetadataParamsFor(params, "URI"))
      return urlPlugin.getFileMetadata(params)
    if (isMetadataParamsFor(params, "webdav"))
      return plugins.webdav.getFileMetadata(params)
    if (isMetadataParamsFor(params, "file"))
      return plugins.file.getFileMetadata(params)
    throw new Error(`No dataSource found for action`)
  },
  download: async (params: DownloadParams) => {
    if (isDownloadParamsFor(params, "DRIVE")) {
      const result = await plugins.DRIVE.download?.(
        params.link,
        params.providerCredentials,
        params.db,
      )
      if (!result) throw new Error(`No dataSource found for action`)
      return result
    }
    if (isDownloadParamsFor(params, "dropbox")) {
      const result = await plugins.dropbox.download?.(
        params.link,
        params.providerCredentials,
        params.db,
      )
      if (!result) throw new Error(`No dataSource found for action`)
      return result
    }
    if (isDownloadParamsFor(params, "synology-drive")) {
      const result = await plugins["synology-drive"].download?.(
        params.link,
        params.providerCredentials,
        params.db,
      )
      if (!result) throw new Error(`No dataSource found for action`)
      return result
    }
    if (isDownloadParamsFor(params, "URI")) {
      const result = await urlPlugin.download?.(
        params.link,
        params.providerCredentials,
        params.db,
      )
      if (!result) throw new Error(`No dataSource found for action`)
      return result
    }
    if (isDownloadParamsFor(params, "webdav")) {
      const result = await plugins.webdav.download?.(
        params.link,
        params.providerCredentials,
        params.db,
      )
      if (!result) throw new Error(`No dataSource found for action`)
      return result
    }
    if (isDownloadParamsFor(params, "file")) {
      const result = await plugins.file.download?.(
        params.link,
        params.providerCredentials,
        params.db,
      )
      if (!result) throw new Error(`No dataSource found for action`)
      return result
    }
    throw new Error(`No dataSource found for action`)
  },
}
