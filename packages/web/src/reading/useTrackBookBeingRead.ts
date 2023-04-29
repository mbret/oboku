import { useEffect } from "react"
import { setBookBeingReadState, setHasOpenedReaderAlreadyState } from "./states"
import { SIGNAL_RESET } from "reactjrx"

export const useTrackBookBeingRead = (bookId: string | undefined) => {
  useEffect(() => {
    setBookBeingReadState(bookId)
    setHasOpenedReaderAlreadyState(true)
  }, [bookId])

  useEffect(
    () => () => {
      setBookBeingReadState(SIGNAL_RESET)
    },
    []
  )
}
