import { atom, selector, useRecoilCallback } from "recoil";
import { useEffect } from "react";
import { Manifest } from "@oboku/reader";
import { Pagination } from "./type";

export const isBookReadyState = atom({
  key: 'isBookReadyState',
  default: false,
})

export const paginationState = atom<Pagination>({
  key: `paginationState`,
  default: undefined
})

export const manifestState = atom<Manifest | undefined>({
  key: `manifestState`,
  default: undefined
})

export const isMenuShownState = atom({
  key: 'isMenuShownState',
  default: false,
})

// =======> Please do not forget to add atom to the reset part !

export const totalPageState = selector({
  key: `totalPageState`,
  get: ({ get }) => {
    const { renditionLayout } = get(manifestState) || {}
    const { numberOfTotalPages, begin } = get(paginationState) || {}

    if (renditionLayout === 'reflowable') return begin?.numberOfPagesInChapter

    return numberOfTotalPages
  }
})

export const currentPageState = selector({
  key: `currentPageState`,
  get: ({ get }) => {
    const { renditionLayout } = get(manifestState) || {}
    const { begin } = get(paginationState) || {}

    if (renditionLayout === 'reflowable') return begin?.pageIndexInChapter
    return begin?.readingItemIndex
  }
})

export const chapterInfoState = selector({
  key: `chapterInfoState`,
  get: ({ get }) => {
    const { begin } = get(paginationState) || {}

    return begin?.chapterInfo
  }
})

export const totalBookProgressState = selector({
  key: `totalBookProgressState`,
  get: ({ get }) => {
    const { percentageEstimateOfBook } = get(paginationState) || {}

    return percentageEstimateOfBook
  }
})

export const hasRightSpineItemState = selector({
  key: `hasRightSpineItemState`,
  get: ({ get }) => {
    const { numberOfTotalPages = 1, begin } = get(paginationState) || {}
    const { readingDirection } = get(manifestState) || {}
    const { readingItemIndex = 0 } = begin || {}

    if (readingDirection === 'ltr') return readingItemIndex < (numberOfTotalPages - 1)
    return readingItemIndex > 0
  }
})

export const hasLeftSpineItemState = selector({
  key: `hasLeftSpineItemState`,
  get: ({ get }) => {
    const { numberOfTotalPages = 1, begin } = get(paginationState) || {}
    const { readingDirection } = get(manifestState) || {}
    const { readingItemIndex = 0 } = begin || {}

    if (readingDirection === 'ltr') return readingItemIndex > 0
    return readingItemIndex < (numberOfTotalPages - 1)
  }
})

const statesToReset = [
  isBookReadyState,
  paginationState,
  isMenuShownState,
  manifestState,
]

export const useResetStateOnUnMount = () => {
  const resetStates = useRecoilCallback(({ reset }) => () => {
    statesToReset.forEach(state => reset(state))
  }, [])

  useEffect(() => {
    return () => resetStates()
  }, [resetStates])
}