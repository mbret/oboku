import { atom, selector, selectorFamily } from "recoil"
import { TagsDocType } from "@oboku/shared"
import { bind } from "@react-rxjs/core"
import { map, Observable, switchMap } from "rxjs"
import { Database } from "../rxdb"

export const [useTag, tag$] = bind(
  (db$: Observable<Database>, id: string) =>
    db$.pipe(
      switchMap((db) => {
        return db.tag.findOne(id).$
      })
    ),
  null
)

export const [useTags, tags$] = bind(
  (database$: Observable<Database>) =>
    database$.pipe(switchMap((database) => database.tag.find({}).$)),
  []
)

export const [useTagIds] = bind(
  (database$: Observable<Database>) =>
    tags$(database$).pipe(map((tags) => tags.map(({ _id }) => _id))),
  []
)

export const [, blurredTags$] = bind(
  (database$: Observable<Database>) =>
    tags$(database$).pipe(
      map((tags) => tags.filter(({ isBlurEnabled }) => isBlurEnabled))
    ),
  []
)

export const [useBlurredTagIds] = bind(
  (database$: Observable<Database>) =>
    blurredTags$(database$).pipe(map((tags) => tags.map(({ _id }) => _id))),
  []
)

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
