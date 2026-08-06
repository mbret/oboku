import { Inject, Injectable } from "@nestjs/common"
import fs from "node:fs"
import path from "node:path"
import { pipeline, Transform } from "node:stream"
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

export class FileDownloadSizeLimitExceededError extends Error {
  constructor(maxSizeBytes: number) {
    super(
      `Download aborted: file exceeds the maximum allowed size of ${maxSizeBytes} bytes`,
    )
  }
}

const createByteLimitTransform = (maxSizeBytes: number) => {
  let downloadedBytes = 0

  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      downloadedBytes += chunk.byteLength

      if (downloadedBytes > maxSizeBytes) {
        callback(new FileDownloadSizeLimitExceededError(maxSizeBytes))
        return
      }

      callback(null, chunk)
    },
  })
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
  constructor(
    @Inject(AppConfigService)
    private readonly appConfigService: Pick<AppConfigService, "TMP_DIR_BOOKS">,
  ) {}

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
    maxSizeBytes,
  }: {
    book: BookDocType
    link: LinkDocType
    providerCredentials: ProviderApiCredentials<DataSourceType>
    db?: createNano.DocumentScope<unknown>
    maxSizeBytes: number
  }) {
    return new Promise<{ filepath: string }>((resolve, reject) => {
      this.download({ link, providerCredentials, db })
        .then(({ stream }) => {
          const filepath = path.join(
            this.appConfigService.TMP_DIR_BOOKS,
            `${book._id}`,
          )
          const fileWriteStream = fs.createWriteStream(filepath, { flags: "w" })

          pipeline(
            stream,
            createByteLimitTransform(maxSizeBytes),
            fileWriteStream,
            (error) => {
              if (error) {
                fs.rm(
                  filepath,
                  { force: true },
                  function rejectAfterPartialFileCleanup() {
                    reject(error)
                  },
                )
                return
              }

              resolve({ filepath })
            },
          )
        })
        .catch(reject)
    })
  }
}
