import type { BookMetadata, OPF } from "@oboku/shared"
import * as fs from "node:fs"
import * as path from "node:path"
import * as unzipper from "unzipper"
import { parseOpfMetadata } from "../../metadata/opf/parseOpfMetadata"
import { Logger } from "@nestjs/common"
import { parseXmlAsJson } from "../parseXmlAsJson"
import { AppConfigService } from "src/config/AppConfigService"

const logger = new Logger("getMetadataFromZipArchive")

export const getMetadataFromZipArchive = async (
  tmpFilePath: string,
  contentType: string,
  config: AppConfigService,
): Promise<BookMetadata> => {
  let contentLength = 0
  const files: string[] = []
  let opfBasePath = ""
  let opfAsJson: OPF = {
    package: {
      manifest: {},
      metadata: {},
    },
  }

  await fs
    .createReadStream(tmpFilePath)
    .pipe(
      unzipper.Parse({
        verbose: false,
      }),
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

  logger.log(`opfBasePath`, opfBasePath)

  const { coverLink: opfCoverLink, ...opfMetadata } =
    parseOpfMetadata(opfAsJson)

  const firstValidImagePath = files
    .filter((file) =>
      config.COVERS_ALLOWED_EXT.includes(path.extname(file).toLowerCase()),
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
      ? opfBasePath !== ""
        ? `${opfBasePath}/${opfCoverLink}`
        : opfCoverLink
      : firstValidImagePath,
  }
}
