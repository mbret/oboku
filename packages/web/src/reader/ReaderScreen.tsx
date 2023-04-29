import { FC } from "react"
import { useParams } from "react-router-dom"
import { AppTourReader } from "../firstTimeExperience/AppTourReader"
import { useWakeLock } from "../common/useWakeLock"
import { useFullScreenSwitch } from "./fullScreen"
import { Reader } from "./Reader"
import { MoreDialog } from "./MoreDialog"
import { useTrackBookBeingRead } from "../reading/useTrackBookBeingRead"
import {
  isBookReadyState,
  isMenuShown,
  manifestState,
  readerState,
} from "./states"
import { useScopeSignals } from "reactjrx"

export const ReaderScreen: FC<{}> = () => {
  const { bookId } = useParams<{ bookId?: string }>()

  useTrackBookBeingRead(bookId)
  useWakeLock()
  useFullScreenSwitch()

  useScopeSignals([isBookReadyState, manifestState, isMenuShown, readerState])

  return (
    <>
      {bookId && <Reader bookId={bookId} />}
      <AppTourReader />
      <MoreDialog />
    </>
  )
}
