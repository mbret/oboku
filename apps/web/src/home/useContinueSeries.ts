import type { CollectionDocType, MongoQueryLogicalIn } from "@oboku/shared"
import { useCollections } from "../collections/useCollections"

export const useContinueSeries = () => {
  const data = useCollections({
    isNotInterested: "none",
    readingState: "ongoing",
    queryObj: {
      selector: {
        type: {
          $in: ["series"] satisfies MongoQueryLogicalIn<
            CollectionDocType["type"]
          >,
        },
      },
    },
  })

  return data
}
