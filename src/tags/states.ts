import { atom, selector, selectorFamily } from "recoil"
import { TagsDocType } from "oboku-shared"
import { bookIdsState } from "../books/states"

export const normalizedTagsState = atom<Record<string, TagsDocType | undefined>>({
  key: 'tagsState',
  default: {}
})

export const tagState = selectorFamily({
  key: 'tagState',
  get: (id: string) => ({ get }) => {
    const tag = get(normalizedTagsState)[id]
    const bookIds = get(bookIdsState)

    if (!tag) return undefined

    return {
      ...tag,
      books: tag.books.filter(id => bookIds.includes(id))
    }
  },
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

    return Object.keys(tags).map(id => get(tagState(id))) as NonNullable<typeof tags[number]>[]
  }
})