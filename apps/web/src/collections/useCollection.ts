import { useQuery$, useSignalValue } from "reactjrx"
import { switchMap, map } from "rxjs"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { observeEmptyCollection } from "./dbHelpers"
import { libraryStateSignal } from "../library/books/states"
import { configuration } from "../config/configuration"

export const useCollection = ({
  id,
  isNotInterested,
  enabled = true,
}: {
  id?: string
  isNotInterested?: "with" | "none" | "only" | undefined
  enabled?: boolean
}) => {
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)

  return useQuery$({
    queryKey: ["rxdb", "collection", id, { isLibraryUnlocked }],
    enabled: !!id && !!enabled,
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) => {
          if (id === configuration.COLLECTION_EMPTY_ID)
            return observeEmptyCollection({
              db,
              includeProtected: isLibraryUnlocked,
              isNotInterested,
            })

          return db.obokucollection
            .findOne({
              selector: {
                _id: id,
              },
            })
            .$.pipe(map((collection) => collection?.toJSON()))
        }),
        map((value) => {
          if (!value) return null

          return value
        }),
      )
    },
  })
}
