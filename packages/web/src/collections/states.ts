import { CollectionDocType, directives } from "@oboku/shared"
import { useVisibleBookIdsState } from "../books/states"
import { useLocalSettingsState } from "../settings/states"
import { useProtectedTagIds } from "../tags/helpers"
import { libraryStateSignal } from "../library/states"
import { useQuery } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { map, switchMap } from "rxjs"
import { keyBy } from "lodash"
import { Database } from "../rxdb"

export type Collection = CollectionDocType

export const getCollectionsByIds = async (database: Database) => {
  const result = await database.collections.obokucollection.find({}).exec()

  return keyBy(result, "_id")
}

export const useCollections = () => {
  return useQuery({
    queryKey: ["db", "get", "collections"],
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) => db.collections.obokucollection.find({}).$),
        map((entries) => keyBy(entries, "_id"))
      )
    },
    staleTime: Infinity
  })
}

/**
 * @deprecated
 */
export const useCollectionsAsArrayState = ({
  libraryState,
  localSettingsState,
  protectedTagIds = []
}: {
  libraryState: ReturnType<typeof libraryStateSignal.getValue>
  localSettingsState: ReturnType<typeof useLocalSettingsState>
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
}) => {
  const localSettings = localSettingsState
  const { data: collections = {} } = useCollections()
  const bookIds = useVisibleBookIdsState({ libraryState, protectedTagIds })
  const ids = Object.keys(collections)

  type Collection = NonNullable<ReturnType<typeof useCollectionState>>

  return ids
    .filter((id) => {
      const collection = collections[id]
      if (localSettings.showCollectionWithProtectedContent === "unlocked") {
        const hasSomeNonVisibleBook = collection?.books.some(
          (bookId) => !bookIds.includes(bookId)
        )
        return !hasSomeNonVisibleBook
      } else {
        const hasSomeVisibleBook = collection?.books.some((bookId) =>
          bookIds.includes(bookId)
        )
        return hasSomeVisibleBook || collection?.books.length === 0
      }
    })
    .map((id) => {
      const value = getCollectionState({
        id,
        normalizedCollections: collections,
        localSettingsState,
        bookIds
      })

      return value
    }) as Collection[]
}

/**
 * @deprecated
 */
export const useCollectionIdsState = ({
  libraryState,
  localSettingsState,
  protectedTagIds = []
}: {
  libraryState: ReturnType<typeof libraryStateSignal.getValue>
  localSettingsState: ReturnType<typeof useLocalSettingsState>
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
}) => {
  return useCollectionsAsArrayState({
    libraryState,
    localSettingsState,
    protectedTagIds
  }).map(({ _id }) => _id)
}

export const getCollectionState = ({
  id,
  localSettingsState,
  normalizedCollections = {},
  bookIds
}: {
  id: string
  localSettingsState: ReturnType<typeof useLocalSettingsState>
  normalizedCollections: ReturnType<typeof useCollections>["data"]
  bookIds: ReturnType<typeof useVisibleBookIdsState>
}) => {
  const collection = normalizedCollections[id]
  const localSettings = localSettingsState

  if (!collection) return undefined

  return {
    ...collection.toJSON(),
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
  libraryState,
  localSettingsState,
  protectedTagIds = []
}: {
  id: string
  libraryState: ReturnType<typeof libraryStateSignal.getValue>
  localSettingsState: ReturnType<typeof useLocalSettingsState>
  protectedTagIds: ReturnType<typeof useProtectedTagIds>["data"]
}) => {
  const { data: normalizedCollections } = useCollections()
  const bookIds = useVisibleBookIdsState({
    libraryState,
    protectedTagIds
  })

  return getCollectionState({
    id,
    localSettingsState,
    normalizedCollections,
    bookIds
  })
}
