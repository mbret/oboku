import { atom, selector } from "recoil";
import { Reader } from "../reader/reader";
import { Manifest } from "../reader/types";

export const bookTitleState = selector({
  key: `bookTitleState`,
  get: ({ get }) => {
    return get(manifestState)?.title
  }
})

export const bookReadyState = atom({
  key: `bookReadyState`,
  default: false
})

export const manifestState = atom<Manifest | undefined>({
  key: `manifestState`,
  default: undefined
})

export const paginationState = atom<ReturnType<Reader['getPagination']> | undefined>({
  key: `paginationState`,
  default: undefined
})

export const isComicState = selector({
  key: `isComicState`,
  get: ({ get }) => {
    const manifest = get(manifestState)

    return manifest?.renditionLayout === 'pre-paginated' || manifest?.readingOrder.every(item => item.renditionLayout === 'pre-paginated')
  }
})