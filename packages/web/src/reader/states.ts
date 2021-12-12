import { atom, selector, useRecoilCallback } from "recoil";
import { useEffect } from "react";
import { Manifest } from "@prose-reader/core";
import { Pagination } from "./type";

export const isBookReadyState = atom({
  key: 'isBookReadyState',
  default: false,
})

export const paginationState = atom<Pagination | undefined>({
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
    const { numberOfTotalPages, beginNumberOfPagesInChapter } = get(paginationState) || {}

    if (renditionLayout === 'reflowable') return beginNumberOfPagesInChapter

    return numberOfTotalPages
  }
})

export const currentPageState = selector({
  key: `currentPageState`,
  get: ({ get }) => {
    const { renditionLayout } = get(manifestState) || {}
    const { beginPageIndexInChapter, beginSpineItemIndex } = get(paginationState) || {}

    if (renditionLayout === 'reflowable') return beginPageIndexInChapter

    return beginSpineItemIndex
  }
})

export const chapterInfoState = selector({
  key: `chapterInfoState`,
  get: ({ get }) => {
    const { beginChapterInfo } = get(paginationState) || {}

    return beginChapterInfo
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
    const { numberOfTotalPages = 1, beginSpineItemIndex = 0 } = get(paginationState) || {}
    const { readingDirection } = get(manifestState) || {}

    if (readingDirection === 'ltr') return beginSpineItemIndex < (numberOfTotalPages - 1)

    return beginSpineItemIndex > 0
  }
})

export const hasLeftSpineItemState = selector({
  key: `hasLeftSpineItemState`,
  get: ({ get }) => {
    const { numberOfTotalPages = 1, beginSpineItemIndex = 0 } = get(paginationState) || {}
    const { readingDirection } = get(manifestState) || {}

    if (readingDirection === 'ltr') return beginSpineItemIndex > 0

    return beginSpineItemIndex < (numberOfTotalPages - 1)
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