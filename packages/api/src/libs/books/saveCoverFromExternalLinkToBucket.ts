import { BookDocType } from "@oboku/shared"
import { Logger } from "@libs/logger"
import axios from "axios"
import { saveCoverFromBufferToBucket } from "./saveCoverFromBufferToBucket"

const logger = Logger.namespace("saveCoverFromExternalLinkToBucket")

type Context = {
  userName: string
}

export const saveCoverFromExternalLinkToBucket = async (
  ctx: Context,
  book: Pick<BookDocType, `_id`>,
  coverUrl: string
) => {
  const objectKey = `cover-${ctx.userName}-${book._id}`

  logger.log(`prepare to save cover ${objectKey}`)

  try {
    // @todo request is deprecated, switch to something else
    // @see https://github.com/request/request/issues/3143
    const response = await axios.get<ArrayBuffer>(coverUrl, {
      responseType: "arraybuffer"
    })
    const entryAsBuffer = Buffer.from(response.data)

    await saveCoverFromBufferToBucket(entryAsBuffer, objectKey)

    Logger.log(`cover ${objectKey} has been saved/updated`)
  } catch (e) {
    logger.error(e)
  }
}
