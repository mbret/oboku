import { createReader, Manifest } from "@prose-reader/core"
import { EMPTY, filter, map, of, switchMap, tap } from "rxjs"
import { hammerGestureEnhancer } from "@prose-reader/enhancer-hammer-gesture"
import { Props as GenericReactReaderProps } from "@prose-reader/react"
import { isDefined, signal, useForeverQuery, useSignalValue } from "reactjrx"

export const createAppReader = hammerGestureEnhancer(createReader)

export type ReaderInstance = ReturnType<typeof createAppReader>

export type ReactReaderProps = GenericReactReaderProps<
  Parameters<typeof createAppReader>[0],
  ReaderInstance
>

export const readerStateSignal = signal<ReaderInstance | undefined>({
  key: "readerState"
})

export const isBookReadyStateSignal = signal({
  key: "isBookReadyState",
  default: false
})

// @todo use query useManifest(bookId)
export const manifestStateSignal = signal<Manifest | undefined>({
  key: `manifestState`,
  default: undefined
})

export const isMenuShownStateSignal = signal({
  key: "isMenuShownState",
  default: false
})

// =======> Please do not forget to add atom to the reset part !

export const usePagination = () =>
  useForeverQuery({
    queryKey: ["pagination"],
    queryFn: () => {
      return readerStateSignal.subject.pipe(
        filter(isDefined),
        switchMap((reader) => reader.pagination$)
      )
    }
  })

export const useCurrentPage = () => {
  const reader = useSignalValue(readerStateSignal)
  const { data: { beginPageIndexInChapter, beginSpineItemIndex } = {} } =
    usePagination()
  const { renditionLayout } = reader?.context.getManifest() ?? {}

  if (renditionLayout === "reflowable") return beginPageIndexInChapter

  return beginSpineItemIndex
}

export const useTotalPage = () => {
  const reader = useSignalValue(readerStateSignal)
  const { renditionLayout } = reader?.context.getManifest() ?? {}
  const { data: { numberOfTotalPages, beginNumberOfPagesInChapter } = {} } =
    usePagination()

  if (renditionLayout === "reflowable") return beginNumberOfPagesInChapter

  return numberOfTotalPages
}
