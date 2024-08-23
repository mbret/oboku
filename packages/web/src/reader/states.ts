import { filter, switchMap } from "rxjs"
import {
  isDefined,
  signal,
  useForeverQuery,
} from "reactjrx"
import { createAppReader } from "./useCreateReader"

export type ReaderInstance = ReturnType<typeof createAppReader>

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
