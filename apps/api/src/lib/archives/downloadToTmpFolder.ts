import type { BookDocType, LinkDocType } from "@oboku/shared"
import * as path from "node:path"
import * as fs from "node:fs"
import { pluginFacade } from "src/lib/plugins/facade"
import { EnvironmentVariables } from "src/features/config/types"
import { ConfigService } from "@nestjs/config"

export const downloadToTmpFolder = (
  book: BookDocType,
  link: LinkDocType,
  config: ConfigService<EnvironmentVariables>,
  credentials?: any,
) =>
  new Promise<{
    filepath: string
    metadata: Awaited<ReturnType<typeof pluginFacade.download>>["metadata"]
  }>((resolve, reject) => {
    pluginFacade
      .download(link, credentials)
      .then(({ stream, metadata }) => {
        let filename = `${book._id}`

        switch (metadata.contentType) {
          case "application/x-cbz": {
            filename = `${book._id}.cbz`
            break
          }
          case "application/epub+zip": {
            filename = `${book._id}.epub`
            break
          }
          default:
        }

        const filepath = path.join(
          config.getOrThrow("TMP_DIR_BOOKS", { infer: true }),
          filename,
        )
        const fileWriteStream = fs.createWriteStream(filepath, { flags: "w" })

        stream
          .on("error", reject)
          .pipe(fileWriteStream)
          .on("finish", () =>
            resolve({
              filepath,
              metadata,
            }),
          )
          .on("error", reject)
      })
      .catch((e) => {
        reject(e)
      })
  })
