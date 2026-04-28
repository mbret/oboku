import { useQuery$, useSignalValue } from "reactjrx"
import {
  createRxdbQueryDefaultOptions,
  RXDB_QUERY_KEY_PREFIX,
} from "../queries/queryClient"
import { switchMap, map } from "rxjs"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { observeEmptyCollection } from "./dbHelpers"
import {
  libraryStateSignal,
  selectIsLibraryUnlocked,
} from "../library/books/states"
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
  const isLibraryUnlocked = useSignalValue(
    libraryStateSignal,
    selectIsLibraryUnlocked,
  )

  return useQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "collection", id, { isLibraryUnlocked }],
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
