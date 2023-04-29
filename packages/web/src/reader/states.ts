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

export const [useReader, setReader, , reader$, , readerState] = signal<
  ReaderInstance | undefined
>({
  key: "readerState"
})

export const [useIsBookReadyState, setIsBookReady, , , , isBookReadyState] =
  signal({
    key: "isBookReadyState",
    default: false
  })

// @todo use query useManifest(bookId)
export const [useManifestState, setManifestState, , , , manifestState] = signal<
  Manifest | undefined
>({
  key: `manifestState`,
  default: undefined
})

export const [useIsMenuShownState, setIsMenuShown, , , , isMenuShown] = signal({
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
