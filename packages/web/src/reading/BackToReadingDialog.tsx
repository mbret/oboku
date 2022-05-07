import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useRecoilState, useRecoilValue } from "recoil"
import { ROUTES } from "../constants"
import { useDialogManager } from "../dialog"
import { bookBeingReadState, hasOpenedReaderAlreadyState } from "./states"

const BASE_READER_ROUTE = ROUTES.READER.replace(`/:id`, ``)

export const BackToReadingDialog = () => {
  const [bookBeingRead, setBookBeingReadState] =
    useRecoilState(bookBeingReadState)
  const hasOpenedReaderAlready = useRecoilValue(hasOpenedReaderAlreadyState)
  const dialog = useDialogManager()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (
      hasOpenedReaderAlready ||
      !bookBeingRead ||
      location.pathname.startsWith(BASE_READER_ROUTE)
    )
      return

    dialog({
      title: `Take me back to my book`,
      content: `It looks like you were reading a book last time you used the app. Do you want to go back to reading?`,
      cancellable: true,
      onConfirm: () => {
        navigate(ROUTES.READER.replace(":id", bookBeingRead))
      },
      onCancel: () => {},
      onClose: () => {
        setBookBeingReadState(undefined)
      }
    })
  }, [
    dialog,
    setBookBeingReadState,
    bookBeingRead,
    location,
    navigate,
    hasOpenedReaderAlready
  ])

  return null
}
