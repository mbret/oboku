import { Logger } from "@nestjs/common"
import type { Archive } from "@prose-reader/archive-reader"
import { openArchive } from "./openArchive.js"

const logger = new Logger("openDownloadedArchive")

export const openDownloadedArchive = (
  filePath: string,
  {
    name,
    contentType,
  }: { name: string | undefined; contentType: string | undefined },
): Promise<Archive | undefined> =>
  openArchive(filePath, { name, encodingFormat: contentType }).catch(
    function logOpenFailure(error: unknown) {
      logger.log(`Could not open the file as an archive: ${error}`)

      return undefined
    },
  )
