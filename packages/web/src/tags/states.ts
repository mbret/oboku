import { atom, selector } from "recoil"
import { TagsDocType } from "@oboku/shared"
import { map, switchMap } from "rxjs"
import { bind, useObserve } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"

export const useTag = (id: string) =>
  useObserve(
    () =>
      latestDatabase$.pipe(
        switchMap((db) => {
          return db.tag.findOne(id).$
        })
      ),
    [id]
  )

export const [useTags, tags$] = bind({
  stream: latestDatabase$.pipe(
    switchMap((database) => database.tag.find({}).$)
  ),
  default: []
})

export const [useProtectedTags, protectedTags$] = bind({
  stream: tags$.pipe(
    map((tag) => tag.filter(({ isProtected }) => isProtected))
  ),
  default: []
})

export const [useTagIds] = bind({
  stream: tags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
  default: []
})

export const [, blurredTags$] = bind({
  stream: tags$.pipe(
    map((tags) => tags.filter(({ isBlurEnabled }) => isBlurEnabled))
  ),
  default: []
})

export const [useBlurredTagIds] = bind({
  stream: blurredTags$.pipe(map((tags) => tags.map(({ _id }) => _id))),
  default: []
})

export const normalizedTagsState = atom<
  Record<string, TagsDocType | undefined>
>({
  key: "tagsState",
  default: {}
})

export const protectedTagIdsState = selector({
  key: "protectedTagIds",
  get: ({ get }) => {
    const tags = get(normalizedTagsState)

    return Object.values(tags)
      .filter((tag) => tag?.isProtected)
      .map((tag) => tag?._id as string)
  }
})

export const bluredTagIdsState = selector<string[]>({
  key: "bluredTagIdsState",
  get: ({ get }) => {
    const tags = get(normalizedTagsState)

    return Object.values(tags)
      .filter((tag) => tag?.isBlurEnabled)
      .map((tag) => tag?._id as string)
  }
})
