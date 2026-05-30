import type createNano from "nano"
import type {
  BookDocType,
  LinkDocType,
  DataSourceType,
  ProviderApiCredentials,
} from "@oboku/shared"
import path from "node:path"
import fs from "node:fs"
import { pipeline } from "node:stream"
import { pluginFacade } from "src/plugins/facade"
import { AppConfigService } from "src/config/AppConfigService"

export const downloadToTmpFolder = (
  book: BookDocType,
  link: LinkDocType,
  config: AppConfigService,
  credentials: ProviderApiCredentials<DataSourceType>,
  db?: createNano.DocumentScope<unknown>,
) =>
  new Promise<{
    filepath: string
  }>((resolve, reject) => {
    pluginFacade
      .download({ link, providerCredentials: credentials, db })
      .then(({ stream }) => {
        const filename = `${book._id}`
        const filepath = path.join(config.TMP_DIR_BOOKS, filename)
        const fileWriteStream = fs.createWriteStream(filepath, { flags: "w" })

        pipeline(stream, fileWriteStream, (error) => {
          if (error) {
            reject(error)
            return
          }

          resolve({ filepath })
        })
      })
      .catch((e) => {
        reject(e)
      })
  })
