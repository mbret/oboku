import { signal } from "reactjrx"

export const bookBeingReadStateSignal = signal<string | undefined>({
  key: `bookBeingReadState`,
})

export const hasOpenedReaderAlreadyStateSignal = signal({
  key: `hasOpenedReaderAlreadyState`,
  default: false,
})
