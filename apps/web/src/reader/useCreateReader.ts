import { useEffect, useState } from "react"
import { SIGNAL_RESET, useLiveRef, useSignalValue } from "reactjrx"
import { gesturesEnhancer } from "@prose-reader/enhancer-gestures"
import { createReader } from "@prose-reader/core"
import { galleryEnhancer } from "@prose-reader/enhancer-gallery"
import { readerSignal } from "./states"
import { useReaderSettingsState } from "./settings/states"
import { localSettingsSignal } from "../settings/states"
import { getResourcePathFromUrl } from "./manifest/getResourcePathFromUrl.shared"
import { webStreamer } from "./streamer/webStreamer"
import { from } from "rxjs"
import { refitEnhancer } from "@prose-reader/enhancer-refit"

export const createAppReader = refitEnhancer(
  galleryEnhancer(gesturesEnhancer(createReader)),
)

export const useCreateReader = ({
  isUsingWebStreamer,
  bookId,
}: {
  isUsingWebStreamer?: boolean
  bookId: string
}) => {
  const [isCreated, setIsCreated] = useState(false)
  const readerSettings = useReaderSettingsState()
  const readerSettingsLiveRef = useLiveRef(readerSettings)
  const reader = useSignalValue(readerSignal)

  useEffect(() => {
    if (
      isUsingWebStreamer !== undefined &&
      !isCreated &&
      !readerSignal.getValue()
    ) {
      setIsCreated(true)

      const instance = createAppReader({
        ...(localSettingsSignal.getValue().themeMode === "e-ink" && {
          pageTurnAnimation: "none",
        }),
        gestures: {
          ...(localSettingsSignal.getValue().themeMode === "e-ink" && {
            panNavigation: "swipe",
          }),
        },
        fontScale: readerSettingsLiveRef.current?.fontScale ?? 1,
        ...(isUsingWebStreamer && {
          getResource: (item) => {
            const resourcePath = getResourcePathFromUrl(item.href)

            return from(
              webStreamer.fetchResource({
                key: bookId,
                resourcePath,
              }),
            )
          },
        }),
      })

      // @ts-expect-error
      window.reader = instance

      readerSignal.setValue(instance)
    }
  }, [isUsingWebStreamer, isCreated, readerSettingsLiveRef, bookId])

  useEffect(() => {
    if (reader) {
      return () => {
        reader.destroy()

        readerSignal.setValue(SIGNAL_RESET)
      }
    }
  }, [reader])
}
