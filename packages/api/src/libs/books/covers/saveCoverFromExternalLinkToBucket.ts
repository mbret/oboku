import { Logger } from "@libs/logger"
import axios from "axios"
import { saveCoverFromBufferToBucket } from "./saveCoverFromBufferToBucket"

const logger = Logger.child({ module: "saveCoverFromExternalLinkToBucket" })

export const saveCoverFromExternalLinkToBucket = async (
  coverKey: string,
  coverUrl: string,
) => {
  Logger.info(`prepare to save cover ${coverKey}`)

  try {
    const response = await axios.get<ArrayBuffer>(coverUrl, {
      responseType: "arraybuffer",
    })
    const entryAsBuffer = Buffer.from(response.data)

    await saveCoverFromBufferToBucket(entryAsBuffer, coverKey)

    Logger.info(`cover ${coverKey} has been saved/updated`)
  } catch (e) {
    logger.error(e)
  }
}
