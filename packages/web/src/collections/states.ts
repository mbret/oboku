import { CollectionDocType, directives } from "@oboku/shared"
import { useLocalSettings } from "../settings/states"
import { useForeverQuery } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { map, switchMap } from "rxjs"
import { keyBy } from "lodash"
import { Database } from "../rxdb"
import { useVisibleBookIds } from "../books/states"

export type Collection = CollectionDocType

export const getCollectionsByIds = async (database: Database) => {
  const result = await database.collections.obokucollection.find({}).exec()

  return keyBy(
    result.map((item) => item.toJSON()),
    "_id"
  )
}

export const useCollections = () => {
  return useForeverQuery({
    queryKey: ["rxdb", "get", "collections"],
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) => db.collections.obokucollection.find({}).$),
        map((items) => items.map((item) => item.toJSON()))
      )
    }
  })
}

export const useCollectionsDictionary = () => {
  const result = useCollections()

  return {
    ...result,
    data: result.data ? keyBy(result.data, "_id") : undefined
  }
}

export const useCollection = ({ id }: { id?: string }) => {
  const localSettings = useLocalSettings()

  return useForeverQuery({
    queryKey: ["rxdb", "collection", id],
    enabled: !!id,
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap(
          (db) =>
            db.obokucollection.findOne({
              selector: {
                _id: id
              }
            }).$
        ),
        map((value) => {
          if (!value) return null

          return {
            ...value?.toJSON(),
            displayableName: localSettings.hideDirectivesFromCollectionName
              ? directives.removeDirectiveFromString(value.name)
              : value.name
          }
        })
      )
    }
  })
}

export const useCollectionsWithPrivacy = () => {
  const { data: collections } = useCollections()
  const visibleBookIds = useVisibleBookIds()
  const { showCollectionWithProtectedContent } = useLocalSettings()

  return {
    data: collections?.filter((collection) => {
      if (showCollectionWithProtectedContent === "unlocked") {
        const hasSomeNonVisibleBook = collection.books.some(
          (bookId) => !visibleBookIds.includes(bookId)
        )

        return !hasSomeNonVisibleBook
      } else {
        const hasSomeVisibleBook = collection?.books.some((bookId) =>
          visibleBookIds.includes(bookId)
        )
        return hasSomeVisibleBook || collection?.books.length === 0
      }
    })
  }
}

/**
 * @deprecated
 */
export const useCollectionsAsArrayState = () => {
  const { data: collectionsDic = {} } = useCollectionsDictionary()
  const visibleBookIds = useVisibleBookIds()
  const localSettingsState = useLocalSettings()

  type Collection = NonNullable<ReturnType<typeof useCollectionState>>

  const { data: visibleCollections = [] } = useCollectionsWithPrivacy()

  return visibleCollections.map((collection) => {
    const value = getCollectionState({
      id: collection._id,
      normalizedCollections: collectionsDic,
      localSettingsState,
      bookIds: visibleBookIds
    })

    return value
  }) as Collection[]
}

export const useVisibleCollectionIds = () => {
  const { data: collections, ...rest } = useCollectionsWithPrivacy()

  return {
    ...rest,
    data: collections ? collections.map(({ _id }) => _id) : undefined
  }
}

/**
 * @deprecated
 */
export const getCollectionState = ({
  id,
  localSettingsState,
  normalizedCollections = {},
  bookIds
}: {
  id: string
  localSettingsState: ReturnType<typeof useLocalSettings>
  normalizedCollections: ReturnType<typeof useCollectionsDictionary>["data"]
  bookIds: ReturnType<typeof useVisibleBookIds>
}) => {
  const collection = normalizedCollections[id]
  const localSettings = localSettingsState

  if (!collection) return undefined

  return {
    ...collection,
    books: collection.books.filter((id) => bookIds.includes(id)),
    displayableName: localSettings.hideDirectivesFromCollectionName
      ? directives.removeDirectiveFromString(collection.name)
      : collection.name
  }
}

/**
 * @deprecated
 */
export const useCollectionState = ({
  id,
  localSettingsState
}: {
  id: string
  localSettingsState: ReturnType<typeof useLocalSettings>
}) => {
  const { data: normalizedCollections } = useCollectionsDictionary()
  const bookIds = useVisibleBookIds()

  return getCollectionState({
    id,
    localSettingsState,
    normalizedCollections,
    bookIds
  })
}
