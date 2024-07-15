import { Logger } from "@libs/logger"
import { saveCoverFromBufferToBucket } from "./saveCoverFromBufferToBucket"
import { Extractor } from "node-unrar-js"
import { COVER_ALLOWED_EXT } from "src/constants"
import path from "path"

const logger = Logger.child({ module: "saveCoverFromArchiveToBucket" })

export const saveCoverFromRarArchiveToBucket = async (
  coverObjectKey: string,
  extractor: Extractor<Uint8Array>
) => {
  try {
    const list = extractor.getFileList()
    const fileHeaders = [...list.fileHeaders] // need to iterate till the end to release memory

    const firstImageFound = fileHeaders.find((fileHeader) => {
      const isAllowedImage = COVER_ALLOWED_EXT.includes(
        path.extname(fileHeader.name).toLowerCase()
      )

      return isAllowedImage
    })

    if (firstImageFound) {
      Logger.info(`prepare to save cover ${coverObjectKey}`)

      const extracted = extractor.extract({ files: [firstImageFound.name] })
      const files = [...extracted.files] // need to iterate till the end to release memory
      const file = files[0]
      if (file && file.extraction) {
        const coverBuffer = Buffer.from(file.extraction)

        await saveCoverFromBufferToBucket(coverBuffer, coverObjectKey)

        Logger.info(`cover ${coverObjectKey} has been saved/updated`)
      }
    }
  } catch (e) {
    logger.error(e)
  }
}
