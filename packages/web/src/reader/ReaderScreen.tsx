import { useState, FC, useCallback } from "react"
import { useParams } from "react-router-dom"
import { AppTourReader } from "../firstTimeExperience/AppTourReader"
import { useResetStateOnUnMount } from "./states"
import { ReaderContext } from "./ReaderProvider"
import { useWakeLock } from "../common/useWakeLock"
import { useFullScreenSwitch } from "./fullScreen"
import { Reader } from "./Reader"
import { Reader as ReaderInstance } from "@prose-reader/core"
import { MoreDialog } from "./MoreDialog"
import { useTrackBookBeingRead } from "../reading/useTrackBookBeingRead"

// @todo add ISBN label in book details

export const ReaderScreen: FC<{}> = () => {
  const [reader, setReader] = useState<ReaderInstance | undefined>(undefined)
  const { bookId } = useParams<{ bookId?: string }>()
  useTrackBookBeingRead(bookId)

  useWakeLock()
  useResetStateOnUnMount()
  useFullScreenSwitch()

  const onReader = useCallback(
    (reader: ReaderInstance) => {
      setReader(reader)
      // @ts-ignore
      window.reader = reader
    },
    [setReader]
  )

  return (
    <ReaderContext.Provider value={reader}>
      {bookId && <Reader bookId={bookId} onReader={onReader} />}
      <AppTourReader />
      <MoreDialog />
    </ReaderContext.Provider>
  )
}
