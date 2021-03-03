import { atom, selector, selectorFamily, UnwrapRecoilValue } from "recoil";
import { CollectionDocType } from '@oboku/shared'
import { protectedBookIdsState } from "../books/states";
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
    const collections = get(normalizedCollectionsState)

    const ids = Object.keys(collections)

    type Collection = NonNullable<UnwrapRecoilValue<ReturnType<typeof collectionState>>>

    return ids.map(id => get(collectionState(id))) as Collection[]
  }
})

export const collectionState = selectorFamily({
  key: 'collectionState',
  get: (id: string) => ({ get }) => {
    const collection = get(normalizedCollectionsState)[id]
    const bookIds = get(protectedBookIdsState)
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