import { atom, selector, selectorFamily, UnwrapRecoilValue } from "recoil";
import { CollectionDocType } from '@oboku/shared'
import { visibleBookIdsState } from "../books/states";
import { removeDirectiveFromString } from "@oboku/shared/dist/directives";
import { localSettingsState } from "../settings/states";

export type Collection = CollectionDocType

export const normalizedCollectionsState = atom<Record<string, Collection | undefined>>({
  key: 'collectionsState',
  default: {}
})

export const collectionsAsArrayState = selector({
  key: 'collectionsAsArrayState',
  get: ({ get }) => {
    const localSettings = get(localSettingsState)
    const collections = get(normalizedCollectionsState)
    const bookIds = get(visibleBookIdsState)
    const ids = Object.keys(collections)

    type Collection = NonNullable<UnwrapRecoilValue<ReturnType<typeof collectionState>>>

    return ids
      .filter(id => {
        const collection = collections[id]
        if (localSettings.showCollectionWithProtectedContent === 'unlocked') {
          const hasSomeNonVisibleBook = collection?.books.some(bookId => !bookIds.includes(bookId))
          return !hasSomeNonVisibleBook
        } else {
          const hasSomeVisibleBook = collection?.books.some(bookId => bookIds.includes(bookId))
          return hasSomeVisibleBook || (collection?.books.length === 0)
        }
      })
      .map(id => get(collectionState(id))) as Collection[]
  }
})

export const collectionIdsState = selector({
  key: 'collectionIdsState',
  get: ({ get }) => {

    return get(collectionsAsArrayState).map(({ _id }) => _id)
  }
})

export const collectionState = selectorFamily({
  key: 'collectionState',
  get: (id: string) => ({ get }) => {
    const collection = get(normalizedCollectionsState)[id]
    const bookIds = get(visibleBookIdsState)
    const localSettings = get(localSettingsState)

    if (!collection) return undefined

    return {
      ...collection,
      books: collection.books.filter(id => bookIds.includes(id)),
      displayableName: localSettings.hideDirectivesFromCollectionName
        ? removeDirectiveFromString(collection.name)
        : collection.name
    }
  }
})