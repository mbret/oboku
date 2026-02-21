import { intersection } from "@oboku/shared"
import { useProtectedTagIds } from "../tags/helpers"
import { useLink } from "../links/states"
import { map, switchMap } from "rxjs"
import { plugin as localPlugin } from "../plugins/local"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { useQuery$, useSignalValue } from "reactjrx"
import type { BookDocType } from "@oboku/shared"
import type { DeepReadonlyObject, MangoQuery } from "rxdb"
import type { DeepReadonlyArray } from "rxdb/dist/types/types"
import { observeBook, observeBooks } from "./dbHelpers"
import { libraryStateSignal } from "../library/books/states"
import type { UseQueryOptions } from "@tanstack/react-query"

type UseBooksOptions = UseQueryOptions<
  DeepReadonlyObject<BookDocType>[],
  unknown,
  DeepReadonlyObject<BookDocType>[]
>

export const useBooks = ({
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
} & Omit<UseBooksOptions, "queryFn" | "queryKey"> = {}) => {
  const serializedIds = JSON.stringify(ids)
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)
  const includeProtected = _includeProtected || isLibraryUnlocked

  return useQuery$({
    queryKey: [
      "rxdb",
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
  enabled = true,
}: {
  id?: string
  enabled?: boolean
}) => {
  return useQuery$({
    queryKey: [`rxdb/bookJSON`, { id }],
    enabled: enabled && !!id,
    queryFn: () => {
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
