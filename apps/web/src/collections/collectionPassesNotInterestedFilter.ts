import { difference, intersection } from "@oboku/shared"
import type { DeepReadonlyArray } from "rxdb"

export const collectionPassesNotInterestedFilter = ({
  collectionBooks,
  isNotInterested,
  notInterestedBookIds,
}: {
  collectionBooks: DeepReadonlyArray<string>
  isNotInterested: "with" | "none" | "only" | undefined
  notInterestedBookIds: string[]
}) => {
  if (isNotInterested === "only") {
    return collectionBooks.length === 0
      ? false
      : intersection(collectionBooks, notInterestedBookIds).length > 0
  }

  if (isNotInterested === "none" && collectionBooks.length > 0) {
    return difference(collectionBooks, notInterestedBookIds).length > 0
  }

  return true
}
