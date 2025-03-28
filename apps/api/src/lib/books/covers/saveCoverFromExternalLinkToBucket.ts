import axios from "axios"
import { saveCoverFromBufferToBucket } from "./saveCoverFromBufferToBucket"
import { Logger } from "@nestjs/common"
import { AppConfigService } from "src/config/AppConfigService"

const logger = new Logger("books/covers/saveCoverFromExternalLinkToBucket")

export const saveCoverFromExternalLinkToBucket = async (
  coverKey: string,
  coverUrl: string,
  config: AppConfigService,
) => {
  logger.log(`prepare to save cover ${coverKey}`)

  try {
    const response = await axios.get<ArrayBuffer>(coverUrl, {
      responseType: "arraybuffer",
    })
    const entryAsBuffer = Buffer.from(response.data)

    await saveCoverFromBufferToBucket(entryAsBuffer, coverKey, config)

    logger.log(`cover ${coverKey} has been saved/updated`)
  } catch (e) {
    logger.error(e)
  }
}
