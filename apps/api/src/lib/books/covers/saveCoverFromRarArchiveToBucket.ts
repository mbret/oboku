import { Logger } from "@nestjs/common"
import { saveCoverFromBufferToBucket } from "./saveCoverFromBufferToBucket"
import type { Extractor } from "node-unrar-js"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "src/types"

const logger = new Logger("books/covers/saveCoverFromRarArchiveToBucket")

export const saveCoverFromRarArchiveToBucket = async (
  coverObjectKey: string,
  extractor: Extractor<Uint8Array>,
  fileName: string,
  config: ConfigService<EnvironmentVariables>,
) => {
  try {
    logger.log(`prepare to save cover ${coverObjectKey}`)

    const extracted = extractor.extract({ files: [fileName] })
    const files = [...extracted.files] // need to iterate till the end to release memory
    const file = files[0]
    if (file?.extraction) {
      const coverBuffer = Buffer.from(file.extraction)

      await saveCoverFromBufferToBucket(coverBuffer, coverObjectKey, config)

      logger.log(`cover ${coverObjectKey} has been saved/updated`)
    }
  } catch (e) {
    logger.error(e)
  }
}
