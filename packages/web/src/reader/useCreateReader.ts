import { useEffect, useState } from "react"
import { SIGNAL_RESET, useLiveRef, useSignalValue } from "reactjrx"
import { gesturesEnhancer } from "@prose-reader/enhancer-gestures"
import { createReader, Manifest } from "@prose-reader/core"
import { readerSignal } from "./states"
import { useReaderSettingsState } from "./settings/states"
import { useFetchResource } from "./streamer/useFetchResource"

export type ReaderInstance = ReturnType<typeof createAppReader>

export const createAppReader = gesturesEnhancer(
  // __
  createReader
)

export const useCreateReader = ({
  manifest,
  isRarFile,
  bookId
}: {
  manifest: Manifest | undefined
  isRarFile?: boolean
  bookId: string
}) => {
  const [isCreated, setIsCreated] = useState(false)
  const readerSettings = useReaderSettingsState()
  const readerSettingsLiveRef = useLiveRef(readerSettings)
  const reader = useSignalValue(readerSignal)

  /**
   * In case of rar archive, we will use our local resource fetcher
   */
  const { fetchResource } = useFetchResource(isRarFile ? bookId : undefined)

  useEffect(() => {
    if (
      !isCreated &&
      manifest &&
      ((isRarFile && fetchResource) || !isRarFile)
    ) {
      setIsCreated(true)

      const instance = createAppReader({
        gestures: {
          // @todo
          // fontScaleMax: FONT_SCALE_MAX,
          // fontScaleMin: FONT_SCALE_MIN
        },
        fontScale: readerSettingsLiveRef.current.fontScale ?? 1,
        fetchResource
      })

      // @ts-ignore
      window.reader = instance

      readerSignal.setValue(instance)
    }
  }, [manifest, isRarFile, isCreated, readerSettingsLiveRef, fetchResource])

  useEffect(() => {
    if (reader) {
      return () => {
        reader.destroy()

        readerSignal.setValue(SIGNAL_RESET)
      }
    }
  }, [reader])
}
