import { type CollectionDocType, getCollectionCoverKey } from "@oboku/shared"
import { isCoverExist } from "src/lib/books/covers/isCoverExist"
import { saveCoverFromExternalLinkToBucket } from "src/lib/books/covers/saveCoverFromExternalLinkToBucket"
import { ConfigService } from "@nestjs/config"
import type { EnvironmentVariables } from "src/features/config/types"

export const saveOrUpdateCover = async (
  prevCollection: Pick<CollectionDocType, "_id" | "metadata">,
  currentCollection: Pick<CollectionDocType, "_id" | "metadata">,
  config: ConfigService<EnvironmentVariables>,
) => {
  const existingCover = prevCollection.metadata?.find(
    (metadata) => metadata.cover,
  )?.cover
  const cover = currentCollection.metadata?.find(
    (metadata) => metadata.cover,
  )?.cover

  if (!cover) return

  const coverKey = getCollectionCoverKey(currentCollection._id)

  if (
    existingCover &&
    cover.uri === existingCover.uri &&
    (await isCoverExist(coverKey))
  ) {
    console.log(`Already have cover ${coverKey} for ${cover.uri}`)

    return
  }

  try {
    await saveCoverFromExternalLinkToBucket(coverKey, cover.uri, config)

    console.log(`Successfully saved cover ${cover.uri} at ${coverKey}`)
  } catch (e) {
    console.error(e)
  }
}
