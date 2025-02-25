import { BookMetadata } from "@oboku/shared"

export const reduceMetadata = (
  metadata?: BookMetadata[],
): Omit<BookMetadata, "type"> => {
  return (
    metadata?.reduce((acc, item) => {
      return {
        ...acc,
        ...item,
      }
    }, {}) ?? {}
  )
}
