import { filter, switchMap } from "rxjs"
import { isDefined, signal, useQuery$, useSignalValue } from "reactjrx"
import type { createAppReader } from "./useCreateReader"

type ReaderInstance = ReturnType<typeof createAppReader>

export const readerSignal = signal<ReaderInstance | undefined>({
  key: "readerState",
})

export const useReader = () => {
  return useSignalValue(readerSignal)
}

export const reader$ = readerSignal.pipe(filter(isDefined))

export const isMenuShownStateSignal = signal({
  key: "isMenuShownState",
  default: false,
})

// =======> Please do not forget to add atom to the reset part !

export const usePagination = () =>
  useQuery$({
    queryKey: ["pagination"],
    queryFn: () => {
      return readerSignal.pipe(
        filter(isDefined),
        switchMap((reader) => reader.pagination.state$),
      )
    },
  })
