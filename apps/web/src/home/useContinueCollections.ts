import type { CollectionDocType, MongoQueryLogicalIn } from "@oboku/shared"
import { useCollections } from "../collections/useCollections"

export const useContinueCollections = () => {
  const data = useCollections({
    isNotInterested: "none",
    readingState: "ongoing",
    queryObj: {
      selector: {
        type: {
          $in: ["shelve", null] satisfies MongoQueryLogicalIn<
            CollectionDocType["type"]
          >,
        },
      },
    },
  })

  return data
}
