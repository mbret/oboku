import fs from "fs"
import unzipper from "unzipper"
import { Logger } from "@libs/logger"
import { saveCoverFromBufferToBucket } from "./saveCoverFromBufferToBucket"
import { asError } from "@libs/utils"

const logger = Logger.child({ module: "saveCoverFromArchiveToBucket" })

export const saveCoverFromZipArchiveToBucket = async (
  coverObjectKey: string,
  epubFilepath: string,
  coverPath: string
) => {
  if (coverPath === ``) {
    logger.error(`coverPath is empty string, ignoring process`, coverObjectKey)
    return
  }

  Logger.info(`prepare to save cover ${coverObjectKey}`)

  const zip = fs
    .createReadStream(epubFilepath)
    .pipe(unzipper.Parse({ forceStream: true }))

  try {
    for await (const entry of zip) {
      if (entry.path === coverPath) {
        const entryAsBuffer = (await entry.buffer()) as Buffer

        await saveCoverFromBufferToBucket(entryAsBuffer, coverObjectKey)

        Logger.info(`cover ${coverObjectKey} has been saved/updated`)
      } else {
        entry.autodrain()
      }
    }
  } catch (e) {
    const { message } = asError(e)
    if (message === `Input buffer contains unsupported image format`) {
      return logger.error(
        `It seems input is not a valid image. This can happens when for example the file is encrypted or something else went wrong during archive extraction`,
        e
      )
    } else {
      logger.error(e)
    }
  }
}
