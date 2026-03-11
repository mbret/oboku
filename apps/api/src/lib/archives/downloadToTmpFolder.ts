import type createNano from "nano"
import type {
  BookDocType,
  LinkDocType,
  DataSourceType,
  ProviderApiCredentials,
} from "@oboku/shared"
import path from "node:path"
import fs from "node:fs"
import { pluginFacade } from "src/lib/plugins/facade"
import { AppConfigService } from "src/config/AppConfigService"

export const downloadToTmpFolder = (
  book: BookDocType,
  link: LinkDocType,
  config: AppConfigService,
  credentials?: ProviderApiCredentials<DataSourceType>,
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

        stream
          .on("error", reject)
          .pipe(fileWriteStream)
          .on("finish", () =>
            resolve({
              filepath,
            }),
          )
          .on("error", reject)
      })
      .catch((e) => {
        reject(e)
      })
  })
