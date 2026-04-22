import { intersection } from "@oboku/shared"
import { useProtectedTagIds } from "../tags/helpers"
import { useLink } from "../links/states"
import { map, switchMap } from "rxjs"
import { plugin as localPlugin } from "../plugins/local"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { useQuery$, useSignalValue } from "reactjrx"
import {
  createRxdbQueryDefaultOptions,
  RXDB_QUERY_KEY_PREFIX,
} from "../queries/queryClient"
import type { BookDocType } from "@oboku/shared"
import type { DeepReadonlyArray, DeepReadonlyObject, MangoQuery } from "rxdb"
import { observeBook, observeBooks } from "./dbHelpers"
import { libraryStateSignal } from "../library/books/states"
import { skipToken, type UseQueryOptions } from "@tanstack/react-query"

type UseBooksOptions<TData = DeepReadonlyObject<BookDocType>[]> =
  UseQueryOptions<DeepReadonlyObject<BookDocType>[], unknown, TData>

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
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)
  const includeProtected = _includeProtected || isLibraryUnlocked

  return useQuery$<DeepReadonlyObject<BookDocType>[], unknown, TData>({
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

export const useBook = ({
  id,
  ...rest
}: {
  id?: string
} & Omit<
  UseQueryOptions<
    DeepReadonlyObject<BookDocType> | null,
    unknown,
    DeepReadonlyObject<BookDocType> | null
  >,
  "queryKey" | "queryFn"
>) => {
  return useQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "bookJSON", { id }],
    queryFn:
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
          },
    ...rest,
  })
}

export type BookQueryResult = NonNullable<ReturnType<typeof useBook>["data"]>

const isBookProtected = (
  protectedTags: string[],
  book: Pick<DeepReadonlyObject<BookDocType>, "tags">,
) => intersection(protectedTags, book?.tags || []).length > 0

export const useIsBookLocal = ({ id }: { id?: string }) => {
  const { data: book } = useBook({ id })
  const { data: link } = useLink({
    id: book?.links[0],
  })

  const isLocal = link && link?.type === localPlugin.type

  return { data: isLocal }
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
