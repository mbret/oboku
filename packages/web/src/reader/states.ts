import { atom } from "recoil";
import { Rendition, Location } from "epubjs"
import { ThenArg } from "../types";

type Navigation = ThenArg<Rendition['book']['loaded']['navigation']>

export const isBookReadyState = atom({
  key: 'isBookReadyState',
  default: false,
})

export const layoutState = atom<'fixed' | 'reflow' | undefined>({
  key: 'layoutState',
  default: undefined,
})

export const isMenuShownState = atom({
  key: 'isMenuShownState',
  default: false,
})

export const currentPageState = atom<number | undefined>({
  key: 'currentPageState',
  default: undefined,
})

export const totalApproximativePagesState = atom<number | undefined>({
  key: 'totalApproximativePagesState',
  default: undefined,
})

export const currentApproximateProgressState = atom<number | undefined>({
  key: 'currentApproximateProgressState',
  default: undefined
})

export const tocState = atom<Navigation['toc']>({
  key: 'tocState',
  default: []
})

export const currentLocationState = atom<Location | undefined>({
  key: 'currentLocationState',
  default: undefined
})

export const currentChapterState = atom<Navigation['toc'][number] | undefined>({
  key: 'currentChapterState',
  default: undefined
})

export const currentDirectionState = atom<'ltr' | 'rtl'>({
  key: 'currentDirectionState',
  default: 'ltr'
})