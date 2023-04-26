import { atom, useRecoilCallback } from "recoil"
import { useEffect } from "react"
import { createReader, Manifest } from "@prose-reader/core"
import { EMPTY, switchMap } from "rxjs"
import { hammerGestureEnhancer } from "@prose-reader/enhancer-hammer-gesture"
import { Props as GenericReactReaderProps } from "@prose-reader/react"
import { signal, useQuery } from "reactjrx"

export const createAppReader = hammerGestureEnhancer(createReader)

export type ReaderInstance = ReturnType<typeof createAppReader>

export type ReactReaderProps = GenericReactReaderProps<
  Parameters<typeof createAppReader>[0],
  ReaderInstance
>

export const [useReader, setReader, , reader$] = signal<
  ReaderInstance | undefined
>({
  scoped: true,
  key: "readerState"
})

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

const pagination$ = reader$.pipe(
  switchMap((reader) => reader?.pagination$ ?? EMPTY)
)

export const usePagination = () => useQuery(pagination$)

export const useCurrentPage = () => {
  const reader = useReader()
  const { data: { beginPageIndexInChapter, beginSpineItemIndex } = {} } =
    usePagination()
  const { renditionLayout } = reader?.context.getManifest() ?? {}

  if (renditionLayout === "reflowable") return beginPageIndexInChapter

  return beginSpineItemIndex
}

export const useTotalPage = () => {
  const reader = useReader()
  const { renditionLayout } = reader?.context.getManifest() ?? {}
  const { data: { numberOfTotalPages, beginNumberOfPagesInChapter } = {} } =
    usePagination()

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
