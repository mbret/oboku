import * as fs from "node:fs"
import * as unzipper from "unzipper"
import { Logger } from "@nestjs/common"
import { asError } from "src/lib/utils"
import { CoversService } from "src/covers/covers.service"
import { firstValueFrom } from "rxjs"

const logger = new Logger("books/covers/saveCoverFromZipArchiveToBucket")

export const saveCoverFromZipArchiveToBucket = async (
  coverObjectKey: string,
  epubFilepath: string,
  coverPath: string,
  coversService: CoversService,
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

        await firstValueFrom(
          coversService.saveCover(entryAsBuffer, coverObjectKey),
        )

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
