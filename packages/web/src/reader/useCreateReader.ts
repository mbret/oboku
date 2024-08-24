import { useEffect, useState } from "react"
import { SIGNAL_RESET, useLiveRef, useSignalValue } from "reactjrx"
import { gesturesEnhancer } from "@prose-reader/enhancer-gestures"
import { createReader, Manifest } from "@prose-reader/core"
import { readerSignal } from "./states"
import { useReaderSettingsState } from "./settings/states"
import { localSettingsSignal } from "../settings/states"
import { getResourcePathFromUrl } from "./manifest/getResourcePathFromUrl.shared"
import { webStreamer } from "./streamer/webStreamer"

export type ReaderInstance = ReturnType<typeof createAppReader>

export const createAppReader = gesturesEnhancer(
  // __
  createReader
)

export const useCreateReader = ({
  manifest,
  isRar,
  bookId
}: {
  manifest: Manifest | undefined
  isRar?: boolean
  bookId: string
}) => {
  const [isCreated, setIsCreated] = useState(false)
  const readerSettings = useReaderSettingsState()
  const readerSettingsLiveRef = useLiveRef(readerSettings)
  const reader = useSignalValue(readerSignal)

  useEffect(() => {
    if (isRar !== undefined && !isCreated && !readerSignal.getValue()) {
      setIsCreated(true)

      const instance = createAppReader({
        ...(localSettingsSignal.getValue().useOptimizedTheme && {
          pageTurnAnimation: "none"
        }),
        gestures: {
          ...(localSettingsSignal.getValue().useOptimizedTheme && {
            panNavigation: "swipe"
          })
          // @todo
          // fontScaleMax: FONT_SCALE_MAX,
          // fontScaleMin: FONT_SCALE_MIN
        },
        fontScale: readerSettingsLiveRef.current.fontScale ?? 1,
        ...(isRar && {
          fetchResource: async (item) => {
            const resourcePath = getResourcePathFromUrl(item.href)

            return webStreamer.fetchResource({
              key: bookId,
              resourcePath
            })
          }
        })
      })

      // @ts-ignore
      window.reader = instance

      readerSignal.setValue(instance)
    }
  }, [isRar, isCreated, readerSettingsLiveRef, bookId])

  useEffect(() => {
    if (reader) {
      return () => {
        reader.destroy()

        readerSignal.setValue(SIGNAL_RESET)
      }
    }
  }, [reader])
}
