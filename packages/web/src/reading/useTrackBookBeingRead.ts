import { useEffect } from "react"
import { useSetRecoilState } from "recoil"
import { bookBeingReadState, hasOpenedReaderAlreadyState } from "./states"

export const useTrackBookBeingRead = (bookId: string | undefined) => {
  const setBookBeingReadState = useSetRecoilState(bookBeingReadState)
  const setHasOpenedReaderAlreadyState = useSetRecoilState(
    hasOpenedReaderAlreadyState
  )

  useEffect(() => {
    setBookBeingReadState(bookId)
    setHasOpenedReaderAlreadyState(true)
  }, [bookId, setBookBeingReadState, setHasOpenedReaderAlreadyState])

  useEffect(
    () => () => {
      setBookBeingReadState(undefined)
    },
    [setBookBeingReadState]
  )
}
