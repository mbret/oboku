import { BookMetadata, OPF } from "@oboku/shared"
import fs from "fs"
import path from "path"
import unzipper from "unzipper"
import { parseXmlAsJson } from "@libs/books/parseXmlAsJson"
import { parseOpfMetadata } from "../../metadata/opf/parseOpfMetadata"
import { Logger } from "@libs/logger"
import { COVER_ALLOWED_EXT } from "src/constants"

const logger = Logger.child({ module: "getMetadataFromZipArchive" })

export const getMetadataFromZipArchive = async (
  tmpFilePath: string,
  contentType: string
): Promise<BookMetadata> => {
  let contentLength = 0
  const files: string[] = []
  let opfBasePath = ""
  let opfAsJson: OPF = {
    package: {
      manifest: {},
      metadata: {}
    }
  }

  await fs
    .createReadStream(tmpFilePath)
    .pipe(
      unzipper.Parse({
        verbose: false
      })
    )
    .on("entry", async (entry: unzipper.Entry) => {
      contentLength = contentLength + entry.vars.compressedSize
      const filepath = entry.path

      if (entry.type === "File") {
        files.push(entry.path)
      }

      if (filepath.endsWith(".opf")) {
        opfBasePath = `${filepath.substring(0, filepath.lastIndexOf("/"))}`
        const xml = (await entry.buffer()).toString("utf8")
        opfAsJson = parseXmlAsJson(xml)
        entry.autodrain()
      } else {
        entry.autodrain()
      }
    })
    .promise()

  logger.info(`opfBasePath`, opfBasePath)

  const { coverLink: opfCoverLink, ...opfMetadata } =
    parseOpfMetadata(opfAsJson)

  const firstValidImagePath = files
    .filter((file) =>
      COVER_ALLOWED_EXT.includes(path.extname(file).toLowerCase())
    )
    .sort()[0]

  return {
    type: "file",
    contentType,
    ...opfMetadata,
    /**
     * Path in the archive to the cover image
     */
    coverLink: opfCoverLink
      ? `${opfBasePath}/${opfCoverLink}`
      : firstValidImagePath
  }
}
