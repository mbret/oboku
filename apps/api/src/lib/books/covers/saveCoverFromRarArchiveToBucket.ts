import { Logger } from "@nestjs/common"
import type { Extractor } from "node-unrar-js"
import { CoversService } from "src/covers/covers.service"
import { firstValueFrom } from "rxjs"

const logger = new Logger("books/covers/saveCoverFromRarArchiveToBucket")

export const saveCoverFromRarArchiveToBucket = async (
  coverObjectKey: string,
  extractor: Extractor<Uint8Array>,
  fileName: string,
  coversService: CoversService,
) => {
  try {
    logger.log(`prepare to save cover ${coverObjectKey}`)

    const extracted = extractor.extract({ files: [fileName] })
    const files = [...extracted.files] // need to iterate till the end to release memory
    const file = files[0]
    if (file?.extraction) {
      const coverBuffer = Buffer.from(file.extraction)

      await firstValueFrom(coversService.saveCover(coverBuffer, coverObjectKey))

      logger.log(`cover ${coverObjectKey} has been saved/updated`)
    }
  } catch (e) {
    logger.error(e)
  }
}
