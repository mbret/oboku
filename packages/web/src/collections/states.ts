import { CollectionDocType, directives } from "@oboku/shared"
import { useLocalSettings } from "../settings/states"
import { useForeverQuery } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { map, switchMap } from "rxjs"
import { keyBy } from "lodash"
import { useVisibleBookIds } from "../books/states"
import { MangoQuery } from "rxdb"
import { getMetadataFromCollection } from "./getMetadataFromCollection"

export type Collection = CollectionDocType

export const useCollections = ({
  queryObj,
  ...options
}: { queryObj?: MangoQuery<CollectionDocType>; enabled?: boolean } = {}) => {
  const localSettings = useLocalSettings()

  return useForeverQuery({
    queryKey: ["rxdb", "get", "collections", queryObj],
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) => db.collections.obokucollection.find(queryObj).$),
        map((items) =>
          items.map((item) => ({
            ...item?.toJSON(),
            displayableName: localSettings.hideDirectivesFromCollectionName
              ? directives.removeDirectiveFromString(
                  getMetadataFromCollection(item).title ?? ""
                )
              : getMetadataFromCollection(item).title
          }))
        )
      )
    },
    ...options
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
              ? directives.removeDirectiveFromString(
                  getMetadataFromCollection(value).title ?? ""
                )
              : getMetadataFromCollection(value).title
          }
        })
      )
    }
  })
}

export const useCollectionsWithPrivacy = ({
  queryObj,
  ...options
}: { queryObj?: MangoQuery<CollectionDocType>; enabled?: boolean } = {}) => {
  const { data: collections } = useCollections({ queryObj, ...options })
  const visibleBookIds = useVisibleBookIds()
  const { showCollectionWithProtectedContent } = useLocalSettings()

  return {
    data: collections?.filter((collection) => {
      if (showCollectionWithProtectedContent === "unlocked") {
        const hasSomeNonVisibleBook = collection.books.some(
          (bookId) => !visibleBookIds?.includes(bookId)
        )

        return !hasSomeNonVisibleBook
      } else {
        const hasSomeVisibleBook = collection?.books.some((bookId) =>
          visibleBookIds?.includes(bookId)
        )
        return hasSomeVisibleBook || collection?.books.length === 0
      }
    })
  }
}

export const useVisibleCollectionIds = (options: { enabled?: boolean } = {}) => {
  const { data: collections, ...rest } = useCollectionsWithPrivacy(options)

  return {
    ...rest,
    data: collections ? collections.map(({ _id }) => _id) : undefined
  }
}
