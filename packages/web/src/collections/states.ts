import { atom, selectorFamily, UnwrapRecoilValue } from "recoil"
import { CollectionDocType, directives } from "@oboku/shared"
import { visibleBookIdsState } from "../books/states"
import { getLibraryState } from "../library/states"
import { useLocalSettingsState } from "../settings/states"

export type Collection = CollectionDocType

export const normalizedCollectionsState = atom<
  Record<string, Collection | undefined>
>({
  key: "collectionsState",
  default: {}
})

/**
 * @deprecated
 */
export const collectionsAsArrayState = selectorFamily({
  key: "collectionsAsArrayState",
  get:
    ({
      libraryState,
      localSettingsState
    }: {
      libraryState: ReturnType<typeof getLibraryState>
      localSettingsState: ReturnType<typeof useLocalSettingsState>
    }) =>
    ({ get }) => {
      const localSettings = localSettingsState
      const collections = get(normalizedCollectionsState)
      const bookIds = get(visibleBookIdsState(libraryState))
      const ids = Object.keys(collections)

      type Collection = NonNullable<
        UnwrapRecoilValue<ReturnType<typeof collectionState>>
      >

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
        .map((id) =>
          get(collectionState({ id, libraryState, localSettingsState }))
        ) as Collection[]
    }
})

/**
 * @deprecated
 */
export const collectionIdsState = selectorFamily({
  key: "collectionIdsState",
  get:
    ({
      libraryState,
      localSettingsState
    }: {
      libraryState: ReturnType<typeof getLibraryState>
      localSettingsState: ReturnType<typeof useLocalSettingsState>
    }) =>
    ({ get }) => {
      return get(
        collectionsAsArrayState({ libraryState, localSettingsState })
      ).map(({ _id }) => _id)
    }
})

/**
 * @deprecated
 */
export const collectionState = selectorFamily({
  key: "collectionState",
  get:
    ({
      id,
      libraryState,
      localSettingsState
    }: {
      id: string
      libraryState: ReturnType<typeof getLibraryState>
      localSettingsState: ReturnType<typeof useLocalSettingsState>
    }) =>
    ({ get }) => {
      const collection = get(normalizedCollectionsState)[id]
      const bookIds = get(visibleBookIdsState(libraryState))
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
})
