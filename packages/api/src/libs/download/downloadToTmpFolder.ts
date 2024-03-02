import { Context } from "@libs/books/retrieveMetadataAndSaveCover"
import { dataSourceFacade } from "@libs/plugins"
import { PromiseReturnType } from "@libs/types"
import { BookDocType, LinkDocType } from "@oboku/shared"
import path from "path"
import fs from "fs"
import { TMP_DIR } from "src/constants"

export const downloadToTmpFolder = (
    ctx: Context,
    book: BookDocType,
    link: LinkDocType
  ) =>
    new Promise<{
      filepath: string
      metadata: PromiseReturnType<typeof dataSourceFacade.download>["metadata"]
    }>((resolve, reject) => {
      dataSourceFacade
        .download(link, ctx.credentials)
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
                metadata
              })
            )
            .on("error", reject)
        })
        .catch((e) => {
          reject(e)
        })
    })
  