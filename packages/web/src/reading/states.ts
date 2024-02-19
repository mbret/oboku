import { signal } from "reactjrx"

export const bookBeingReadStateSignal = signal<string | undefined>({
  key: `bookBeingReadState`,
  default: undefined
})

export const bookBeingReadStatePersist = bookBeingReadStateSignal
export const hasOpenedReaderAlreadyStateSignal = signal({
  key: `hasOpenedReaderAlreadyState`,
  default: false
})
