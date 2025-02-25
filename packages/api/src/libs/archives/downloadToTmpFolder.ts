import type { PromiseReturnType } from "@libs/types"
import type { BookDocType, LinkDocType } from "@oboku/shared"
import path from "path"
import fs from "fs"
import { TMP_DIR } from "src/constants"
import { pluginFacade } from "@libs/plugins/facade"

export const downloadToTmpFolder = (
  book: BookDocType,
  link: LinkDocType,
  credentials?: any,
) =>
  new Promise<{
    filepath: string
    metadata: PromiseReturnType<typeof pluginFacade.download>["metadata"]
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

        const filepath = path.join(TMP_DIR, filename)
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
