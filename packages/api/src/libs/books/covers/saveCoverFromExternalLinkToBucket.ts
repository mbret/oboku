import { Logger } from "@libs/logger"
import axios from "axios"
import { saveCoverFromBufferToBucket } from "./saveCoverFromBufferToBucket"

const logger = Logger.child({ module: "saveCoverFromExternalLinkToBucket" })

type Context = {
  userNameHex: string
}

export const saveCoverFromExternalLinkToBucket = async (
  ctx: Context,
  bookId: string,
  coverUrl: string
) => {
  const objectKey = `cover-${ctx.userNameHex}-${bookId}`

  Logger.info(`prepare to save cover ${objectKey}`)

  try {
    // @todo request is deprecated, switch to something else
    // @see https://github.com/request/request/issues/3143
    const response = await axios.get<ArrayBuffer>(coverUrl, {
      responseType: "arraybuffer"
    })
    const entryAsBuffer = Buffer.from(response.data)

    await saveCoverFromBufferToBucket(entryAsBuffer, objectKey)

    Logger.info(`cover ${objectKey} has been saved/updated`)
  } catch (e) {
    logger.error(e)
  }
}
