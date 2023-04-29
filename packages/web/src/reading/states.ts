import { signal, withPersistance } from "reactjrx"

export const [
  bookBeingReadStatePersist,
  useBookBeingReadState,
  setBookBeingReadState
] = withPersistance(
  signal<string | undefined>({
    key: `bookBeingReadState`,
    default: undefined
  })
)

export const [useHasOpenedReaderAlreadyState, setHasOpenedReaderAlreadyState] =
  signal({
    key: `hasOpenedReaderAlreadyState`,
    default: false
  })
