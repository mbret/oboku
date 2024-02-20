import { TagsDocType } from "@oboku/shared"
import { useCallback } from "react"
import { useDatabase } from "../rxdb"
import { useMutation } from "reactjrx"
import { delay, first, ignoreElements, map, switchMap, tap } from "rxjs"
import { useQuery } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { Database } from "../rxdb"

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
        .then(
          (doc) =>
            doc?.incrementalModify((doc) => ({
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
    tags.reduce(
      (acc, tag) => {
        acc[tag._id] = tag

        return acc
      },
      {} as Record<string, TagsDocType>
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
  useQuery({
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
      ),
    staleTime: Infinity
  })

export const useTags = () =>
  useQuery({
    queryFn: () => tags$.pipe(map((tags) => tags.map((tag) => tag.toJSON()))),
    queryKey: ["tags"],
    staleTime: Infinity
  })

export const useTagsByIds = () =>
  useQuery({ queryFn: tagsByIds$, queryKey: ["tagsById"], staleTime: Infinity })

export const useProtectedTags = () =>
  useQuery({
    queryFn: protectedTags$.pipe(
      map((tags) => tags.map((tag) => tag.toJSON()))
    ),
    queryKey: ["protectedTags"],
    staleTime: Infinity
  })

export const useTagIds = () =>
  useQuery({
    queryFn: () => tags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
    queryKey: ["tagsIds"],
    staleTime: Infinity
  })

export const blurredTags$ = tags$.pipe(
  map((tags) =>
    tags.filter(({ isBlurEnabled }) => isBlurEnabled).map((tag) => tag.toJSON())
  )
)

export const useBlurredTagIds = () =>
  useQuery({
    queryFn: () => blurredTags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
    queryKey: ["blurredTagIds"],
    staleTime: Infinity
  })

export const useProtectedTagIds = () =>
  useQuery({
    queryFn: () =>
      protectedTags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
    queryKey: ["protectedTagIds"],
    staleTime: Infinity
  })
