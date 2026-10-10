import { type CollectionDocType, getCollectionCoverKey } from "@oboku/shared"
import { saveCoverFromExternalLinkToBucket } from "../../../lib/books/covers/saveCoverFromExternalLinkToBucket.js"
import { CoversService } from "../../../covers/covers.service.js"
import { firstValueFrom } from "rxjs"

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
    console.log(`Already have cover ${coverKey} for ${cover.uri}`)

    return
  }

  try {
    await saveCoverFromExternalLinkToBucket(coverKey, cover.uri, coversService)

    console.log(`Successfully saved cover ${cover.uri} at ${coverKey}`)
  } catch (e) {
    console.error(e)
  }
}
