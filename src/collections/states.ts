import { atom, selector } from "recoil";
import { CollectionDocType } from '../rxdb/collection'

export const normalizedCollectionsState = atom<Record<string, CollectionDocType | undefined>>({
  key: 'collectionsState',
  default: {}
})

export const collectionsAsArrayState = selector<CollectionDocType[]>({
  key: 'collectionsAsArrayState',
  get: ({ get }) => {
    const collections = get(normalizedCollectionsState)
    
    return Object.values(collections) as NonNullable<typeof collections[number]>[]
  }
})