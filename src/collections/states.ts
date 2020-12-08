import { atom, selector } from "recoil";
import { CollectionDocType } from '../rxdb/collection'

export type Collection = CollectionDocType

export const normalizedCollectionsState = atom<Record<string, Collection | undefined>>({
  key: 'collectionsState',
  default: {}
})

export const collectionsAsArrayState = selector<Collection[]>({
  key: 'collectionsAsArrayState',
  get: ({ get }) => {
    const collections = get(normalizedCollectionsState)

    return Object.values(collections) as NonNullable<typeof collections[number]>[]
  }
})