import { isBookProtected } from "@oboku/shared"
import { useProtectedTagIds } from "../tags/helpers"
import { createLinkQueryOptions, useLink } from "../links/states"
import { isRemovableFromSource } from "../links/isRemovableFromSource"
import { map, type Observable, switchMap } from "rxjs"
import { plugin as localPlugin } from "../integrations/plugins/local"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import {
  type UseLiveQuery$Options,
  useLiveQueries$,
  useLiveQuery$,
  useSignalValue,
} from "reactjrx"
import {
  createRxdbQueryDefaultOptions,
  RXDB_QUERY_KEY_PREFIX,
} from "../queries/queryClient"
import type { BookDocType } from "@oboku/shared"
import type { DeepReadonlyArray, DeepReadonlyObject, MangoQuery } from "rxdb"
import { observeBook, observeBooks } from "./dbHelpers"
import {
  libraryStateSignal,
  selectIsLibraryUnlocked,
} from "../library/books/states"
import { type SkipToken, skipToken } from "@tanstack/react-query"

type UseBooksOptions<TData = DeepReadonlyObject<BookDocType>[]> =
  UseLiveQuery$Options<DeepReadonlyObject<BookDocType>[], unknown, TData>

export const useBooks = <TData = DeepReadonlyObject<BookDocType>[]>({
  queryObj = {},
  isNotInterested,
  ids,
  includeProtected: _includeProtected,
  ...options
}: {
  queryObj?: MangoQuery<BookDocType>
  isNotInterested?: "none" | "with" | "only"
  ids?: DeepReadonlyArray<string>
  includeProtected?: boolean
} & Omit<UseBooksOptions<TData>, "queryFn" | "queryKey"> = {}) => {
  const serializedIds = JSON.stringify(ids)
  const isLibraryUnlocked = useSignalValue(
    libraryStateSignal,
    selectIsLibraryUnlocked,
  )
  const includeProtected = _includeProtected || isLibraryUnlocked

  return useLiveQuery$<DeepReadonlyObject<BookDocType>[], unknown, TData>({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [
      RXDB_QUERY_KEY_PREFIX,
      "get",
      "many",
      "books",
      { isNotInterested, serializedIds, includeProtected },
      queryObj,
    ],
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) =>
          observeBooks({
            db,
            protected: includeProtected ? "with" : "none",
            ids,
            isNotInterested,
            queryObj,
          }),
        ),
        map((items) => {
          return items.map((item) => item.toJSON())
        }),
      )
    },
    ...options,
  })
}

/**
 * The ids of every book this device holds, protected or not. Takes the options
 * of a live query, such as a `select`.
 */
export const useBookIds = <TData = string[]>(
  options: Omit<
    UseLiveQuery$Options<string[], unknown, TData>,
    "queryKey" | "queryFn"
  > = {},
) =>
  useLiveQuery$<string[], unknown, TData>({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "bookIds"],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap(function observeAllBooks(database) {
          return database.book.find({}).$
        }),
        map(function toBookIds(books) {
          return books.map(({ _id }) => _id)
        }),
      ),
    ...options,
  })

/**
 * A `useBookIds` selector: the ids in `ids` of the books this device holds, in
 * the order of `ids`, or `undefined` while `ids` is. `ids` can hold ids of
 * deleted books, or of books the device has not received yet.
 */
export const selectHeldIds =
  (ids: DeepReadonlyArray<string> | undefined) => (bookIds: string[]) => {
    if (ids === undefined) return undefined

    const heldBookIds = new Set(bookIds)

    return ids.filter((id) => heldBookIds.has(id))
  }

type BookQueryOptions = ReturnType<typeof createRxdbQueryDefaultOptions> & {
  queryKey: (string | { id: string | undefined })[]
  queryFn:
    | SkipToken
    | (() => Observable<DeepReadonlyObject<BookDocType> | null>)
}

export const createBookQueryOptions = ({
  id,
}: {
  id?: string
}): BookQueryOptions => {
  const queryFn: BookQueryOptions["queryFn"] =
    id === undefined
      ? skipToken
      : () => {
          return latestDatabase$.pipe(
            switchMap((db) =>
              observeBook({
                db,
                queryObj: id,
              }),
            ),
            map((value) => {
              return value?.toJSON() ?? null
            }),
          )
        }

  return {
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "bookJSON", { id }],
    queryFn,
  }
}

export const useBook = ({
  id,
  ...rest
}: {
  id?: string
} & Omit<
  UseLiveQuery$Options<
    DeepReadonlyObject<BookDocType> | null,
    unknown,
    DeepReadonlyObject<BookDocType> | null
  >,
  "queryKey" | "queryFn"
>) => {
  return useLiveQuery$({
    ...createBookQueryOptions({ id }),
    ...rest,
  })
}

export type BookQueryResult = NonNullable<ReturnType<typeof useBook>["data"]>

export const useIsBookLocal = ({ id }: { id?: string }) => {
  const { data: book } = useBook({ id })
  const { data: link } = useLink({
    id: book?.links[0],
  })

  const isLocal = link && link?.type === localPlugin.type

  return { data: isLocal }
}

const combineBooksRemovableFromSource = (
  results: ReturnType<typeof useLink>[],
) => ({
  data: results.some((result) => isRemovableFromSource({ link: result.data })),
})

export const useHasBooksRemovableFromSource = ({
  ids,
}: {
  ids?: DeepReadonlyArray<string>
}) => {
  const { data: books } = useBooks({ ids, includeProtected: true })

  return useLiveQueries$({
    queries:
      books?.flatMap((book) =>
        book.links[0] ? [createLinkQueryOptions({ id: book.links[0] })] : [],
      ) ?? [],
    combine: combineBooksRemovableFromSource,
  })
}

export const useIsBookProtected = (
  book?: Parameters<typeof isBookProtected>[1] | null,
) => {
  const { data: protectedTagIds, ...rest } = useProtectedTagIds({
    enabled: !!book,
  })

  return {
    ...rest,
    data:
      protectedTagIds && book
        ? isBookProtected(protectedTagIds, book)
        : undefined,
  }
}
