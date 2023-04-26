import { FC } from "react"
import { useParams } from "react-router-dom"
import { AppTourReader } from "../firstTimeExperience/AppTourReader"
import { useResetStateOnUnMount } from "./states"
import { useWakeLock } from "../common/useWakeLock"
import { useFullScreenSwitch } from "./fullScreen"
import { Reader } from "./Reader"
import { MoreDialog } from "./MoreDialog"
import { useTrackBookBeingRead } from "../reading/useTrackBookBeingRead"

export const ReaderScreen: FC<{}> = () => {
  const { bookId } = useParams<{ bookId?: string }>()

  useTrackBookBeingRead(bookId)
  useWakeLock()
  useResetStateOnUnMount()
  useFullScreenSwitch()

  return (
    <>
      {bookId && <Reader bookId={bookId} />}
      <AppTourReader />
      <MoreDialog />
    </>
  )
}
