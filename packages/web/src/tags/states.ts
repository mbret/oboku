import { atom, selector } from "recoil"
import { TagsDocType } from "@oboku/shared"
import { map, switchMap } from "rxjs"
import {  useObserve, useQuery } from "reactjrx"
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

const tags$ = latestDatabase$.pipe(
  switchMap((database) => database.tag.find({}).$)
)

export const useTags = () =>
  useQuery(() =>
    latestDatabase$.pipe(switchMap((database) => database.tag.find({}).$))
  )

export const protectedTags$ = tags$.pipe(
  map((tag) => tag.filter(({ isProtected }) => isProtected))
)

export const useProtectedTags = () => useQuery(protectedTags$)

export const useTagIds = () =>
  useQuery(() => tags$.pipe(map((tags) => tags.map(({ _id }) => _id))))

export const blurredTags$ = tags$.pipe(
  map((tags) => tags.filter(({ isBlurEnabled }) => isBlurEnabled))
)

export const useBlurredTagIds = () =>
  useQuery(() => blurredTags$.pipe(map((tags) => tags.map(({ _id }) => _id))))

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
