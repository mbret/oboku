import { createReader } from "@prose-reader/core"
import { filter, switchMap } from "rxjs"
import { gesturesEnhancer } from "@prose-reader/enhancer-gestures"
import { Props as GenericReactReaderProps } from "@prose-reader/react"
import { isDefined, signal, useForeverQuery, useSignalValue } from "reactjrx"

export const createAppReader = gesturesEnhancer(createReader)

export type ReaderInstance = ReturnType<typeof createAppReader>

export type ReactReaderProps = GenericReactReaderProps<
  Parameters<typeof createAppReader>[0],
  ReaderInstance
>

export const readerSignal = signal<ReaderInstance | undefined>({
  key: "readerState"
})

export const reader$ = readerSignal.subject.pipe(filter(isDefined))

export const isMenuShownStateSignal = signal({
  key: "isMenuShownState",
  default: false
})

// =======> Please do not forget to add atom to the reset part !

export const usePagination = () =>
  useForeverQuery({
    queryKey: ["pagination"],
    queryFn: () => {
      return readerSignal.subject.pipe(
        filter(isDefined),
        switchMap((reader) => reader.pagination.state$)
      )
    }
  })

export const useCurrentPage = () => {
  const reader = useSignalValue(readerSignal)
  const { data: { beginPageIndexInSpineItem, beginSpineItemIndex } = {} } =
    usePagination()
  const { renditionLayout } = reader?.context.manifest ?? {}

  if (renditionLayout === "reflowable") return beginPageIndexInSpineItem

  return beginSpineItemIndex
}

export const useTotalPage = () => {
  const reader = useSignalValue(readerSignal)
  const { renditionLayout } = reader?.context.manifest ?? {}
  const { data: { numberOfTotalPages, beginNumberOfPagesInSpineItem } = {} } =
    usePagination()

  if (renditionLayout === "reflowable") return beginNumberOfPagesInSpineItem

  return numberOfTotalPages
}
