import * as fs from "node:fs"
import * as unzipper from "unzipper"
import { saveCoverFromBufferToBucket } from "./saveCoverFromBufferToBucket"
import { Logger } from "@nestjs/common"
import { asError } from "src/lib/utils"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "src/features/config/types"

const logger = new Logger("books/covers/saveCoverFromZipArchiveToBucket")

export const saveCoverFromZipArchiveToBucket = async (
  coverObjectKey: string,
  epubFilepath: string,
  coverPath: string,
  config: ConfigService<EnvironmentVariables>,
) => {
  if (coverPath === ``) {
    logger.error(`coverPath is empty string, ignoring process`, coverObjectKey)
    return
  }

  logger.log(`prepare to save cover ${coverObjectKey}`)

  const zip = fs
    .createReadStream(epubFilepath)
    .pipe(unzipper.Parse({ forceStream: true }))

  try {
    for await (const entry of zip) {
      if (entry.path === coverPath) {
        const entryAsBuffer = (await entry.buffer()) as Buffer

        await saveCoverFromBufferToBucket(entryAsBuffer, coverObjectKey, config)

        logger.log(`cover ${coverObjectKey} has been saved/updated`)
      } else {
        entry.autodrain()
      }
    }
  } catch (e) {
    const { message } = asError(e)
    if (message === `Input buffer contains unsupported image format`) {
      return logger.error(
        `It seems input is not a valid image. This can happens when for example the file is encrypted or something else went wrong during archive extraction`,
        e,
      )
    }
    logger.error(e)
  }
}
