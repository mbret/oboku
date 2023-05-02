import { TagsDocType } from "@oboku/shared"
import { useCallback } from "react"
import { useDatabase } from "../rxdb"
import { useMutation } from "reactjrx"
import { map, switchMap } from "rxjs"
import { useQuery } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { Database } from "../rxdb"

export const useCreateTag = () => {
  const { db } = useDatabase()

  return useMutation(async ({ name }: { name: string }) =>
    db?.tag.insertSafe({
      name,
      books: [],
      isProtected: false,
      createdAt: new Date().toISOString(),
      modifiedAt: null
    })
  )
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
  switchMap((database) => database.tag.find({}).$)
)

const tagsByIds$ = tags$.pipe(
  map((tags) =>
    tags.reduce((acc, tag) => {
      acc[tag._id] = tag

      return acc
    }, {} as Record<string, TagsDocType>)
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

  return result.reduce((acc, tag) => {
    acc[tag._id] = tag

    return acc
  }, {} as Record<string, TagsDocType>)
}

export const useTag = (id: string) =>
  useQuery(["rxdb", "tag", id], () =>
    latestDatabase$.pipe(
      switchMap((db) => {
        return db.tag.findOne(id).$
      })
    )
  )

export const useTags = () => useQuery(tags$)

export const useTagsByIds = () => useQuery(tagsByIds$)

export const useProtectedTags = () => useQuery(protectedTags$)

export const useTagIds = () =>
  useQuery(() => tags$.pipe(map((tags) => tags.map(({ _id }) => _id))))

export const blurredTags$ = tags$.pipe(
  map((tags) => tags.filter(({ isBlurEnabled }) => isBlurEnabled))
)

export const useBlurredTagIds = () =>
  useQuery(() => blurredTags$.pipe(map((tags) => tags.map(({ _id }) => _id))))

export const useProtectedTagIds = () =>
  useQuery(() => protectedTags$.pipe(map((tags) => tags.map(({ _id }) => _id))))
