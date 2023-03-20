import { FC, useCallback } from "react"
import { useParams } from "react-router-dom"
import { AppTourReader } from "../firstTimeExperience/AppTourReader"
import {
  reader$,
  ReaderInstance,
  updateReader,
  useResetStateOnUnMount
} from "./states"
import { useWakeLock } from "../common/useWakeLock"
import { useFullScreenSwitch } from "./fullScreen"
import { Reader } from "./Reader"
import { MoreDialog } from "./MoreDialog"
import { useTrackBookBeingRead } from "../reading/useTrackBookBeingRead"
import { Subscribe } from "@react-rxjs/core"

export const ReaderScreen: FC<{}> = () => {
  const { bookId } = useParams<{ bookId?: string }>()
  useTrackBookBeingRead(bookId)

  useWakeLock()
  useResetStateOnUnMount()
  useFullScreenSwitch()

  const onReader = useCallback((reader: ReaderInstance) => {
    updateReader(reader)
    // @ts-ignore
    window.reader = reader
  }, [])

  return (
    <>
      {bookId && <Reader bookId={bookId} onReader={onReader} />}
      <AppTourReader />
      <MoreDialog />
      <Subscribe source$={reader$} />
    </>
  )
}
