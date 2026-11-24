import { Inject, Injectable } from "@nestjs/common"
import fs from "node:fs"
import path from "node:path"
import { pipeline, Transform } from "node:stream"
import type createNano from "nano"
import {
  type BookDocType,
  type SourceType,
  type LinkDocType,
  type LinkDocTypeForSource,
  type SourceApiCredentials,
  parseSourceApiCredentials,
} from "@oboku/shared"
import { AppConfigService } from "../config/AppConfigService.js"
import { getPlugin } from "./plugins.js"
import type { PluginMetadataParams } from "./types.js"

type DownloadParams<T extends SourceType = SourceType> = {
  link: LinkDocTypeForSource<T>
  providerCredentials: SourceApiCredentials<T>
  db?: createNano.DocumentScope<unknown>
}

export class FileDownloadSizeLimitExceededError extends Error {
  constructor(maxSizeBytes: number) {
    super(
      `Download aborted: file exceeds the maximum allowed size of ${maxSizeBytes} bytes`,
    )
  }
}

/** Passes on at most `maxSizeBytes`, and fails the stream past them. */
export const createByteLimitTransform = (maxSizeBytes: number) => {
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

const getRequiredPlugin = <T extends SourceType>(type: T) => {
  const plugin = getPlugin(type)

  if (!plugin) {
    throw new Error("No library sync found for action")
  }

  return plugin
}

@Injectable()
export class PluginsService {
  constructor(
    @Inject(AppConfigService)
    private readonly appConfigService: Pick<AppConfigService, "TMP_DIR_BOOKS">,
  ) {}

  getFolderMetadata<T extends SourceType>(params: PluginMetadataParams<T>) {
    return getRequiredPlugin(params.link.type).getFolderMetadata({
      ...params,
      providerCredentials: parseSourceApiCredentials(
        params.link.type,
        params.providerCredentials,
      ),
    })
  }

  getFileMetadata<T extends SourceType>(params: PluginMetadataParams<T>) {
    return getRequiredPlugin(params.link.type).getFileMetadata({
      ...params,
      providerCredentials: parseSourceApiCredentials(
        params.link.type,
        params.providerCredentials,
      ),
    })
  }

  download<T extends SourceType>(params: DownloadParams<T>) {
    return getRequiredPlugin(params.link.type).download(
      params.link,
      parseSourceApiCredentials(params.link.type, params.providerCredentials),
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
    providerCredentials: SourceApiCredentials<SourceType>
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
