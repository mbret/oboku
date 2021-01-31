import { atom, selector, selectorFamily } from "recoil";
import { CollectionDocType } from 'oboku-shared'
import { protectedBookIdsState } from "../books/states";

export type Collection = CollectionDocType

export const normalizedCollectionsState = atom<Record<string, Collection | undefined>>({
  key: 'collectionsState',
  default: {}
})

export const collectionsAsArrayState = selector<Collection[]>({
  key: 'collectionsAsArrayState',
  get: ({ get }) => {
    const collections = get(normalizedCollectionsState)

    const ids = Object.keys(collections)

    return ids.map(id => get(collectionState(id))) as NonNullable<typeof collections[number]>[]
  }
})

export const collectionState = selectorFamily({
  key: 'collectionState',
  get: (id: string) => ({ get }) => {
    const collection = get(normalizedCollectionsState)[id]
    const bookIds = get(protectedBookIdsState)

    if (!collection) return undefined

    return {
      ...collection,
      books: collection.books.filter(id => bookIds.includes(id))
    }
  }
})