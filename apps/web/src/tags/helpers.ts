import type { TagsDocType } from "@oboku/shared"
import { useCallback } from "react"
import { useDatabase } from "../rxdb"
import { map, mergeMap, switchMap } from "rxjs"
import { type UseLiveQuery$Options, useLiveQuery$ } from "reactjrx"
import {
  createRxdbQueryDefaultOptions,
  RXDB_QUERY_KEY_PREFIX,
} from "../queries/queryClient"
import { getLatestDatabase, latestDatabase$ } from "../rxdb/RxDbProvider"
import type { DeepReadonlyObject, MangoQuery } from "rxdb"
import { useMutation } from "@tanstack/react-query"

export const useCreateTag = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({ name }: { name: string }) =>
      db?.tag.insertSafe({
        name,
        books: [],
        isProtected: false,
        createdAt: new Date().toISOString(),
        modifiedAt: null,
      }),
  })
}

export const useUpdateTag = () => {
  const { db } = useDatabase()

  return useCallback(
    ({
      _id,
      ...rest
    }: Partial<TagsDocType> & Required<Pick<TagsDocType, "_id">>) =>
      db?.tag.findOne(_id).incrementalPatch(rest),
    [db],
  )
}

const tags$ = latestDatabase$.pipe(
  switchMap((database) => database.tag.find({}).$),
  map((tags) => tags.map((item) => item.toJSON())),
)

const protectedTags$ = tags$.pipe(
  map((tag) => tag.filter(({ isProtected }) => isProtected)),
)

export const useTag = <TData = DeepReadonlyObject<TagsDocType> | null>(
  id?: string,
  options: Omit<
    UseLiveQuery$Options<
      DeepReadonlyObject<TagsDocType> | null,
      unknown,
      TData
    >,
    "queryKey" | "queryFn"
  > = {},
) => {
  return useLiveQuery$<DeepReadonlyObject<TagsDocType> | null, unknown, TData>({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "tag", id],
    enabled: !!id,
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) => {
          return db.tag
            .findOne(id)
            .$.pipe(map((result) => result?.toJSON() ?? null))
        }),
      ),
    ...options,
  })
}

export const useTags = ({
  queryObj,
  ...options
}: {
  enabled?: boolean
  queryObj?: MangoQuery<TagsDocType> | undefined
} = {}) =>
  useLiveQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "tags", queryObj],
    queryFn: () =>
      getLatestDatabase().pipe(
        mergeMap((database) => database.tag.find(queryObj).$),
        map((items) => items.map((item) => item.toJSON())),
      ),
    ...options,
  })

export const useTagIds = () =>
  useLiveQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryFn: () => tags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "tagsIds"],
  })

const blurredTags$ = tags$.pipe(
  map((tags) => tags.filter(({ isBlurEnabled }) => isBlurEnabled)),
)

export const useBlurredTagIds = () =>
  useLiveQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryFn: () => blurredTags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "blurredTagIds"],
  })

export const useProtectedTagIds = (options: { enabled?: boolean } = {}) =>
  useLiveQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "protectedTagIds"],
    queryFn: () =>
      protectedTags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
    ...options,
  })
