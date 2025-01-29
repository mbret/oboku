import {  useQuery$, useSignalValue } from "reactjrx"
import { switchMap, map } from "rxjs"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { observeEmptyCollection } from "./dbHelpers"
import { libraryStateSignal } from "../library/books/states"
import { COLLECTION_EMPTY_ID } from "../constants.shared"

export const useCollection = ({
  id,
  isNotInterested
}: {
  id?: string
  isNotInterested?: "with" | "none" | "only" | undefined
}) => {
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)

  return useQuery$({
    queryKey: ["rxdb", "collection", id, { isLibraryUnlocked }],
    enabled: !!id,
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) => {
          if (id === COLLECTION_EMPTY_ID)
            return observeEmptyCollection({
              db,
              includeProtected: isLibraryUnlocked,
              isNotInterested
            })

          return db.obokucollection
            .findOne({
              selector: {
                _id: id
              }
            })
            .$.pipe(map((collection) => collection?.toJSON()))
        }),
        map((value) => {
          if (!value) return null

          return value
        })
      )
    }
  })
}
