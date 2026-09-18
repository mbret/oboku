import { type CollectionDocType, getCollectionCoverKey } from "@oboku/shared"
import { Logger } from "@nestjs/common"
import { CoversService } from "src/covers/covers.service"
import { firstValueFrom } from "rxjs"

const logger = new Logger("saveOrUpdateCover")

export const saveOrUpdateCover = async (
  prevCollection: Pick<CollectionDocType, "_id" | "metadata">,
  currentCollection: Pick<CollectionDocType, "_id" | "metadata">,
  coversService: CoversService,
  userNameHex: string,
) => {
  const existingCover = prevCollection.metadata?.find(
    (metadata) => metadata.cover,
  )?.cover
  const cover = currentCollection.metadata?.find(
    (metadata) => metadata.cover,
  )?.cover

  if (!cover) return

  const coverKey = getCollectionCoverKey(userNameHex, currentCollection._id)

  if (
    existingCover &&
    cover.uri === existingCover.uri &&
    (await firstValueFrom(coversService.isCoverExist(coverKey)))
  ) {
    logger.log(`Already have cover ${coverKey} for ${cover.uri}`)

    return
  }

  const saved = await coversService.saveCoverFromUrl(coverKey, cover.uri)

  if (saved) {
    logger.log(`Successfully saved cover ${cover.uri} at ${coverKey}`)
  }
}
