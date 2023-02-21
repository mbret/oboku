import { atom, selector, useRecoilCallback } from "recoil"
import { useEffect } from "react"
import { Manifest } from "@prose-reader/core"
import { ReaderInstance } from "./type"
import { Observable, switchMap } from "rxjs"
import { bind } from "@react-rxjs/core"
import { useReader } from "./ReaderProvider"

export const isBookReadyState = atom({
  key: "isBookReadyState",
  default: false
})

export const manifestState = atom<Manifest | undefined>({
  key: `manifestState`,
  default: undefined
})

export const isMenuShownState = atom({
  key: "isMenuShownState",
  default: false
})

// =======> Please do not forget to add atom to the reset part !

export const [usePagination] = bind(
  (reader$: Observable<ReaderInstance>) =>
    reader$.pipe(switchMap((reader) => reader.pagination$)),
  undefined
)

export const useCurrentPage = () => {
  const { reader$, reader } = useReader()
  const { beginPageIndexInChapter, beginSpineItemIndex } =
    usePagination(reader$) ?? {}
  const { renditionLayout } = reader?.context.getManifest() ?? {}

  if (renditionLayout === "reflowable") return beginPageIndexInChapter

  return beginSpineItemIndex
}

export const useTotalPage = () => {
  const { reader$, reader } = useReader()
  const { renditionLayout } = reader?.context.getManifest() ?? {}
  const { numberOfTotalPages, beginNumberOfPagesInChapter } =
    usePagination(reader$) ?? {}

  if (renditionLayout === "reflowable") return beginNumberOfPagesInChapter

  return numberOfTotalPages
}

const statesToReset = [isBookReadyState, isMenuShownState, manifestState]

export const useResetStateOnUnMount = () => {
  const resetStates = useRecoilCallback(
    ({ reset }) =>
      () => {
        statesToReset.forEach((state) => reset(state))
      },
    []
  )

  useEffect(() => {
    return () => resetStates()
  }, [resetStates])
}
