import {
  type BookMetadata,
  getBookMetadataFields,
  type ReadonlyBookMetadataFields,
} from "@oboku/shared"

export const reduceMetadata = (
  metadata?: BookMetadata[],
): ReadonlyBookMetadataFields => {
  return (
    metadata?.reduce<ReadonlyBookMetadataFields>((acc, item) => {
      return {
        ...acc,
        ...getBookMetadataFields(item),
      }
    }, {}) ?? {}
  )
}
