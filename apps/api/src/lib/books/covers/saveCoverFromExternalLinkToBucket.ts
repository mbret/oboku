import axios from "axios"
import { Logger } from "@nestjs/common"
import { CoversService } from "src/covers/covers.service"
import { firstValueFrom } from "rxjs"

const logger = new Logger("books/covers/saveCoverFromExternalLinkToBucket")

export const saveCoverFromExternalLinkToBucket = async (
  coverKey: string,
  coverUrl: string,
  coversService: CoversService,
) => {
  logger.log(`prepare to save cover ${coverKey}`)

  try {
    const response = await axios.get<ArrayBuffer>(coverUrl, {
      responseType: "arraybuffer",
    })
    const entryAsBuffer = Buffer.from(response.data)

    await firstValueFrom(coversService.saveCover(entryAsBuffer, coverKey))

    logger.log(`cover ${coverKey} has been saved/updated`)
  } catch (e) {
    logger.error(e)
  }
}
