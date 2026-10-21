import { Logger } from "@nestjs/common"
import {
  type Archive,
  getArchiveFileRecordByUri,
} from "@prose-reader/archive-reader"
import { asError } from "../../utils.js"
import { CoversService } from "../../../covers/covers.service.js"
import { firstValueFrom } from "rxjs"

const logger = new Logger("books/covers/saveCoverFromArchiveToBucket")

export const saveCoverFromArchiveToBucket = async (
  coverObjectKey: string,
  archive: Archive,
  coverLink: string,
  coversService: CoversService,
): Promise<boolean> => {
  logger.log(`prepare to save cover ${coverObjectKey}`)

  try {
    const cover = await getArchiveFileRecordByUri(
      archive,
      coverLink,
    )?.arrayBuffer()

    if (!cover) return false

    await firstValueFrom(
      coversService.saveCover(Buffer.from(cover), coverObjectKey),
    )

    logger.log(`cover ${coverObjectKey} has been saved/updated`)

    return true
  } catch (e) {
    const isUnsupportedImageFormat =
      asError(e).message === `Input buffer contains unsupported image format`

    if (isUnsupportedImageFormat) {
      logger.error(
        `It seems input is not a valid image. This can happens when for example the file is encrypted or something else went wrong during archive extraction`,
        e,
      )

      return false
    }
    logger.error(e)

    return false
  }
}
