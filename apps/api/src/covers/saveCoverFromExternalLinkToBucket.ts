import axios from "axios"
import { Logger } from "@nestjs/common"
import { CoversService } from "./covers.service.js"
import { firstValueFrom } from "rxjs"
import { getUserAddressRequestOptions } from "../http/userAddressAgents.js"

const logger = new Logger("covers/saveCoverFromExternalLinkToBucket")

export const saveCoverFromExternalLinkToBucket = async (
  coverKey: string,
  coverUrl: string,
  coversService: CoversService,
): Promise<boolean> => {
  logger.log(`prepare to save cover ${coverKey}`)

  try {
    const response = await axios.get<ArrayBuffer>(coverUrl, {
      responseType: "arraybuffer",
      ...getUserAddressRequestOptions(),
    })
    const entryAsBuffer = Buffer.from(response.data)

    await firstValueFrom(coversService.saveCover(entryAsBuffer, coverKey))

    logger.log(`cover ${coverKey} has been saved/updated`)

    return true
  } catch (e) {
    logger.error(e)

    return false
  }
}
