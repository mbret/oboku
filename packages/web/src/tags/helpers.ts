import type { TagsDocType } from "@oboku/shared"
import { useCallback } from "react"
import { useDatabase } from "../rxdb"
import { map, mergeMap, switchMap } from "rxjs"
import { useQuery$ } from "reactjrx"
import { getLatestDatabase, latestDatabase$ } from "../rxdb/RxDbProvider"
import type { Database } from "../rxdb"
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
      db?.tag
        .findOne({ selector: { _id } })
        .exec()
        .then((doc) =>
          doc?.incrementalModify((doc) => ({
            ...doc,
            ...rest,
          })),
        ),
    [db],
  )
}

const tags$ = latestDatabase$.pipe(
  switchMap((database) => database.tag.find({}).$),
  map((tags) => tags.map((item) => item.toJSON())),
)

const tagsByIds$ = tags$.pipe(
  map((tags) =>
    tags.reduce(
      (acc, tag) => {
        acc[tag._id] = tag

        return acc
      },
      {} as Record<string, DeepReadonlyObject<TagsDocType>>,
    ),
  ),
)

const protectedTags$ = tags$.pipe(
  map((tag) => tag.filter(({ isProtected }) => isProtected)),
)

/**
 * @deprecated move to observable
 */
export const getProtectedTags = async (db: Database) => {
  const result = await db.tag.find({}).exec()

  return result.filter(({ isProtected }) => isProtected).map(({ _id }) => _id)
}

/**
 * @deprecated move to observable
 */
export const getTagsByIds = async (db: Database) => {
  const result = await db.tag.find({}).exec()

  return result.reduce(
    (acc, tag) => {
      acc[tag._id] = tag

      return acc
    },
    {} as Record<string, TagsDocType>,
  )
}

export const useTag = (id?: string) => {
  return useQuery$({
    queryKey: ["rxdb", "tag", id],
    enabled: !!id,
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) => {
          return db.tag.findOne(id).$.pipe(
            map((result) => {
              return result?.toJSON()
            }),
          )
        }),
      ),
  })
}

export const useTags = ({
  queryObj,
  ...options
}: {
  enabled?: boolean
  queryObj?: MangoQuery<TagsDocType> | undefined
} = {}) =>
  useQuery$({
    queryKey: ["rxdb", "tags", queryObj],
    queryFn: () =>
      getLatestDatabase().pipe(
        mergeMap((database) => database.tag.find(queryObj).$),
        map((items) => items.map((item) => item.toJSON())),
      ),
    ...options,
  })

export const useTagsByIds = () =>
  useQuery$({ queryFn: tagsByIds$, queryKey: ["tagsById"] })

export const useTagIds = () =>
  useQuery$({
    queryFn: () => tags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
    queryKey: ["tagsIds"],
  })

const blurredTags$ = tags$.pipe(
  map((tags) => tags.filter(({ isBlurEnabled }) => isBlurEnabled)),
)

export const useBlurredTagIds = () =>
  useQuery$({
    queryFn: () => blurredTags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
    queryKey: ["blurredTagIds"],
  })

export const useProtectedTagIds = (options: { enabled?: boolean } = {}) =>
  useQuery$({
    queryKey: ["protectedTagIds"],
    queryFn: () =>
      protectedTags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
    ...options,
  })
