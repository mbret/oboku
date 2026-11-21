import { useLiveQuery$ } from "reactjrx"
import { map, switchMap } from "rxjs"
import { useBooks } from "../books/states"
import {
  createRxdbQueryDefaultOptions,
  RXDB_QUERY_KEY_PREFIX,
} from "../queries/queryClient"
import { latestDatabase$ } from "../rxdb/RxDbProvider"

export const useFixableAnnotations = () => {
  const { data: books } = useBooks({ includeProtected: true })
  const { data: annotations } = useLiveQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "get", "many", "annotation/list"],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) => db.annotation.find({}).$),
        map((entries) => entries.map((item) => item.toJSON())),
      ),
  })
  const isEveryQueryLoaded = books !== undefined && annotations !== undefined

  if (!isEveryQueryLoaded) return { danglingAnnotations: [] }

  const bookIds = new Set(books.map((book) => book._id))
  const danglingAnnotations = annotations
    .filter((annotation) => !bookIds.has(annotation.bookId))
    .map((annotation) => annotation._id)

  return { danglingAnnotations }
}
