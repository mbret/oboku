import { Metadata } from "@oboku/shared"

export const reduceMetadata = (
  metadata?: Metadata[]
): Omit<Metadata, "type"> => {
  return (
    metadata?.reduce((acc, item) => {
      return {
        ...acc,
        ...item
      }
    }, {}) ?? {}
  )
}
