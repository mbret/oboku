import { Logger } from "@libs/logger"
import { saveCoverFromBufferToBucket } from "./saveCoverFromBufferToBucket"
import { Extractor } from "node-unrar-js"

const logger = Logger.child({ module: "saveCoverFromArchiveToBucket" })

export const saveCoverFromRarArchiveToBucket = async (
  coverObjectKey: string,
  extractor: Extractor<Uint8Array>,
  fileName: string
) => {
  try {
    Logger.info(`prepare to save cover ${coverObjectKey}`)

    const extracted = extractor.extract({ files: [fileName] })
    const files = [...extracted.files] // need to iterate till the end to release memory
    const file = files[0]
    if (file && file.extraction) {
      const coverBuffer = Buffer.from(file.extraction)

      await saveCoverFromBufferToBucket(coverBuffer, coverObjectKey)

      Logger.info(`cover ${coverObjectKey} has been saved/updated`)
    }
  } catch (e) {
    logger.error(e)
  }
}
