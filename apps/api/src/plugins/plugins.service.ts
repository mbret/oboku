import { Injectable } from "@nestjs/common"
import fs from "node:fs"
import path from "node:path"
import { pipeline } from "node:stream"
import type createNano from "nano"
import {
  type BookDocType,
  type DataSourceType,
  type LinkDocType,
  type LinkDocTypeForProvider,
  type LinkWithCredentials,
  type ProviderApiCredentials,
  parseProviderApiCredentials,
} from "@oboku/shared"
import { AppConfigService } from "src/config/AppConfigService"
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

@Injectable()
export class PluginsService {
  constructor(private readonly appConfigService: AppConfigService) {}

  getFolderMetadata<T extends DataSourceType>(params: MetadataParams<T>) {
    return getRequiredPlugin(params.link.type).getFolderMetadata({
      ...params,
      providerCredentials: parseProviderApiCredentials(
        params.link.type,
        params.providerCredentials,
      ),
    })
  }

  getFileMetadata<T extends DataSourceType>(params: MetadataParams<T>) {
    return getRequiredPlugin(params.link.type).getFileMetadata({
      ...params,
      providerCredentials: parseProviderApiCredentials(
        params.link.type,
        params.providerCredentials,
      ),
    })
  }

  download<T extends DataSourceType>(params: DownloadParams<T>) {
    return getRequiredPlugin(params.link.type).download(
      params.link,
      parseProviderApiCredentials(params.link.type, params.providerCredentials),
      params.db,
    )
  }

  downloadLinkToTmp({
    book,
    link,
    providerCredentials,
    db,
  }: {
    book: BookDocType
    link: LinkDocType
    providerCredentials: ProviderApiCredentials<DataSourceType>
    db?: createNano.DocumentScope<unknown>
  }) {
    return new Promise<{ filepath: string }>((resolve, reject) => {
      this.download({ link, providerCredentials, db })
        .then(({ stream }) => {
          const filepath = path.join(
            this.appConfigService.TMP_DIR_BOOKS,
            `${book._id}`,
          )
          const fileWriteStream = fs.createWriteStream(filepath, { flags: "w" })

          pipeline(stream, fileWriteStream, (error) => {
            if (error) {
              reject(error)
              return
            }

            resolve({ filepath })
          })
        })
        .catch(reject)
    })
  }
}
