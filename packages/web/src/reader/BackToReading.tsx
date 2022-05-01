import { useEffect } from "react"
import { useHistory } from "react-router-dom"
import { atom, useRecoilState, useSetRecoilState } from "recoil"
import { ROUTES } from "../constants"
import { useDialogManager } from "../dialog"

const BASE_READER_ROUTE = ROUTES.READER.replace(`/:id`, ``)

export const bookBeingReadState = atom<string | undefined>({
  key: `bookBeingReadState`,
  default: undefined
})

export const useTrackBookBeingRead = (bookId: string | undefined) => {
  const setBookBeingReadState = useSetRecoilState(bookBeingReadState)

  useEffect(() => {
    setBookBeingReadState(bookId)
  }, [bookId, setBookBeingReadState])

  useEffect(
    () => () => {
      setBookBeingReadState(undefined)
    },
    [setBookBeingReadState]
  )
}

export const BackToReading = () => {
  const [bookBeingRead, setBookBeingReadState] =
    useRecoilState(bookBeingReadState)
  const dialog = useDialogManager()
  const history = useHistory()

  useEffect(() => {
    if (
      !bookBeingRead ||
      history.location.pathname.startsWith(BASE_READER_ROUTE)
    )
      return

    dialog({
      title: `Take me back to my book`,
      content: `It looks like you were reading a book last time you used the app. Do you want to go back to reading?`,
      cancellable: true,
      onConfirm: () => {
        history.push(ROUTES.READER.replace(":id", bookBeingRead))
      },
      onCancel: () => {},
      onClose: () => {
        setBookBeingReadState(undefined)
      }
    })
  }, [dialog, setBookBeingReadState, bookBeingRead, history])

  return null
}
