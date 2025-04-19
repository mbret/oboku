import type { BookDocType, LinkDocType } from "@oboku/shared"
import path from "node:path"
import fs from "node:fs"
import { pluginFacade } from "src/lib/plugins/facade"
import { AppConfigService } from "src/config/AppConfigService"

export const downloadToTmpFolder = (
  book: BookDocType,
  link: LinkDocType,
  config: AppConfigService,
  credentials?: any,
) =>
  new Promise<{
    filepath: string
  }>((resolve, reject) => {
    pluginFacade
      .download(link, credentials)
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
