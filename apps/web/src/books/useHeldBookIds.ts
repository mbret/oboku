import { isShallowEqual } from "@oboku/shared"
import { useLiveQuery$ } from "reactjrx"
import type { DeepReadonlyArray } from "rxdb"
import { distinctUntilChanged, map, switchMap } from "rxjs"
import {
  createRxdbQueryDefaultOptions,
  RXDB_QUERY_KEY_PREFIX,
} from "../queries/queryClient"
import { latestDatabase$ } from "../rxdb/RxDbProvider"

const heldBookIds$ = latestDatabase$.pipe(
  switchMap(function observeAllBooks(database) {
    return database.book.find({}).$
  }),
  map(function toBookIds(books) {
    return books.map(({ _id }) => _id)
  }),
  distinctUntilChanged(isShallowEqual),
  map(function toBookIdSet(ids) {
    return new Set(ids)
  }),
)

/**
 * The ids in `ids` of the books this device holds, in the order of `ids`.
 * `ids` can hold ids of deleted books, or of books the device has not received
 * yet. Protected and not interested books stay in the result.
 */
export const useHeldBookIds = (ids: DeepReadonlyArray<string> | undefined) => {
  const { data: heldBookIds } = useLiveQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "heldBookIds"],
    queryFn: () => heldBookIds$,
  })

  if (ids === undefined || heldBookIds === undefined) return undefined

  return ids.filter((id) => heldBookIds.has(id))
}
