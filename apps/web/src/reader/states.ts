import { signal, useSignalValue } from "reactjrx"
import type { createAppReader } from "./useCreateReader"

type ReaderInstance = ReturnType<typeof createAppReader>

export const readerSignal = signal<ReaderInstance | undefined>({
  key: "readerState",
})

export const useReader = () => {
  return useSignalValue(readerSignal)
}

export const isMenuShownStateSignal = signal({
  key: "isMenuShownState",
  default: false,
})

// =======> Please do not forget to add atom to the reset part !
