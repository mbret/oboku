import { TagsDocType } from "@oboku/shared"
import { useCallback } from "react"
import { useDatabase } from "../rxdb"
import { useMutation } from "reactjrx"
import { map, switchMap } from "rxjs"
import { useForeverQuery } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { Database } from "../rxdb"
import { DeepReadonlyObject } from "rxdb"

export const useCreateTag = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async ({ name }: { name: string }) =>
      db?.tag.insertSafe({
        name,
        books: [],
        isProtected: false,
        createdAt: new Date().toISOString(),
        modifiedAt: null
      })
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
          doc?.atomicUpdate((doc) => ({
            ...doc,
            ...rest
          }))
        ),
    [db]
  )
}

const tags$ = latestDatabase$.pipe(
  switchMap((database) => database.tag.find({}).$),
  map((tags) => tags.map((item) => item.toJSON()))
)

const tagsByIds$ = tags$.pipe(
  map((tags) =>
    tags.reduce(
      (acc, tag) => {
        acc[tag._id] = tag

        return acc
      },
      {} as Record<string, DeepReadonlyObject<TagsDocType>>
    )
  )
)

export const protectedTags$ = tags$.pipe(
  map((tag) => tag.filter(({ isProtected }) => isProtected))
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
    {} as Record<string, TagsDocType>
  )
}

export const useTag = (id: string) =>
  useForeverQuery({
    queryKey: ["rxdb", "tag", id],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) => {
          return db.tag.findOne(id).$.pipe(
            map((result) => {
              return result?.toJSON()
            })
          )
        })
      )
  })

export const useTags = () =>
  useForeverQuery({
    queryFn: () => tags$,
    queryKey: ["rxdb", "tags"]
  })

export const useTagsByIds = () =>
  useForeverQuery({ queryFn: tagsByIds$, queryKey: ["tagsById"] })

export const useProtectedTags = () =>
  useForeverQuery({
    queryFn: protectedTags$,
    queryKey: ["protectedTags"]
  })

export const useTagIds = () =>
  useForeverQuery({
    queryFn: () => tags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
    queryKey: ["tagsIds"]
  })

export const blurredTags$ = tags$.pipe(
  map((tags) => tags.filter(({ isBlurEnabled }) => isBlurEnabled))
)

export const useBlurredTagIds = () =>
  useForeverQuery({
    queryFn: () => blurredTags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
    queryKey: ["blurredTagIds"]
  })

export const useProtectedTagIds = (options: { enabled?: boolean } = {}) =>
  useForeverQuery({
    queryKey: ["protectedTagIds"],
    queryFn: () =>
      protectedTags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
    ...options
  })
