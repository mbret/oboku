import { isCoverExist } from "@libs/books/covers/isCoverExist"
import { saveCoverFromExternalLinkToBucket } from "@libs/books/covers/saveCoverFromExternalLinkToBucket"
import { CollectionDocType, getCollectionCoverKey } from "@oboku/shared"

export const saveOrUpdateCover = async (
  prevCollection: Pick<CollectionDocType, "_id" | "metadata">,
  currentCollection: Pick<CollectionDocType, "_id" | "metadata">,
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
    await saveCoverFromExternalLinkToBucket(coverKey, cover.uri)

    console.log(`Successfully saved cover ${cover.uri} at ${coverKey}`)
  } catch (e) {
    console.error(e)
  }
}
