import { atom, selector } from "recoil";
import { TagsDocType } from "../databases";

export const normalizedTagsState = atom<Record<string, TagsDocType | undefined>>({
  key: 'tagsState',
  default: {}
})

export const protectedTagIdsState = selector({
  key: 'protectedTagIds',
  get: ({ get }) => {
    const tags = get(normalizedTagsState)

    return Object.values(tags).filter(tag => tag?.isProtected).map(tag => tag?._id)
  }
})

export const tagsAsArrayState = selector<TagsDocType[]>({
  key: 'tagsAsArrayState',
  get: ({ get }) => {
    const tags = get(normalizedTagsState)
    
    return Object.values(tags) as NonNullable<typeof tags[number]>[]
  }
})