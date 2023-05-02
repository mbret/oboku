/**
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js#L407-L469
 */
import { useState, useEffect, useCallback, FC, memo } from "react"
import { useNavigate } from "react-router-dom"
import { useMeasure } from "react-use"
import { Box, Button, Link, Typography, useTheme } from "@mui/material"
import { useRecoilValue } from "recoil"
import { bookState } from "../books/states"
import {
  createAppReader,
  ReactReaderProps,
  setIsBookReady,
  setManifestState,
  setReader,
  useIsBookReadyState,
  useReader
} from "./states"
import { TopBar } from "./TopBar"
import { BottomBar } from "./BottomBar"
import { useBookResize } from "./layout"
import { useGestureHandler } from "./gestures"
import { BookLoading } from "./BookLoading"
import Hammer from "hammerjs"
import { useCSS } from "../common/utils"
import { Reader as ObokuReader } from "@prose-reader/react"
import { useManifest } from "./manifest"
import { useRarStreamer } from "./streamer/useRarStreamer.shared"
import { useUpdateBookState } from "./bookHelpers"
import { FloatingBottom } from "./FloatingBottom"
import { FONT_SCALE_MAX, FONT_SCALE_MIN } from "./constants"
import { usePersistReaderInstanceSettings } from "./settings/usePersistReaderSettings"
import { Notification } from "./Notification"
import { useReaderSettingsState } from "./settings/states"
import { useTagsByIds } from "../tags/helpers"

export const Reader: FC<{
  bookId: string
}> = memo(({ bookId }) => {
  const reader = useReader()
  const isBookReady = useIsBookReadyState()
  const readerSettings = useReaderSettingsState()
  const book = useRecoilValue(
    bookState({ tags: useTagsByIds().data, bookId: bookId || "-1" })
  )
  const navigate = useNavigate()
  const [
    containerMeasureRef,
    { width: containerWidth, height: containerHeight }
  ] = useMeasure()
  const [readerContainerHammer, setReaderContainerHammer] = useState<
    HammerManager | undefined
  >(undefined)
  const styles = useStyles()
  const [loadOptions, setLoadOptions] = useState<
    ReactReaderProps["loadOptions"] | undefined
  >()
  const { manifest, isRarFile, error: manifestError } = useManifest(bookId)
  const { fetchResource } = useRarStreamer(isRarFile ? bookId : undefined)
  const [readerOptions, setReaderOptions] = useState<
    ReactReaderProps["options"] | undefined
  >()
  const isBookError = !!manifestError
  // We don't want to display overlay for comics / manga
  const showFloatingMenu =
    reader?.context.getManifest()?.renditionLayout !== "pre-paginated"

  useBookResize(reader, containerWidth, containerHeight)
  useGestureHandler(readerContainerHammer)
  useUpdateBookState(bookId)
  usePersistReaderInstanceSettings()

  useEffect(() => {
    return () => {
      setIsBookReady(false)
    }
  }, [])

  useEffect(() => {
    setManifestState(manifest)
  }, [manifest])

  const onBookReady = useCallback(() => {
    setIsBookReady(true)
  }, [])

  useEffect(() => {
    if (manifest && book && !readerOptions) {
      setReaderOptions({
        forceSinglePageMode: true,
        numberOfAdjacentSpineItemToPreLoad:
          manifest.renditionLayout === "pre-paginated" ? 1 : 0,
        hammerGesture: {
          enableFontScalePinch: true,
          fontScaleMax: FONT_SCALE_MAX,
          fontScaleMin: FONT_SCALE_MIN
        },
        fontScale: readerSettings.fontScale ?? 1
      })

      if (isRarFile && fetchResource) {
        setLoadOptions({
          fetchResource,
          cfi: book.readingStateCurrentBookmarkLocation || undefined
        })
      }
      if (!isRarFile) {
        setLoadOptions({
          cfi: book.readingStateCurrentBookmarkLocation || undefined
        })
      }
    }
  }, [book, manifest, readerOptions, isRarFile, fetchResource, readerSettings])

  if (isBookError) {
    if (manifestError?.code === "fileNotSupported") {
      return (
        <div style={styles.infoContainer}>
          <Box mb={2}>
            <Typography>
              Oups! it looks like the book <b>{book?.title}</b> is not supported
              yet. If you would like to be able to open it please visit the{" "}
              <Link
                href="https://docs.oboku.me"
                target="__blank"
                underline="hover"
              >
                documentation
              </Link>{" "}
              and try to reach out.
            </Typography>
          </Box>
          <Button
            onClick={() => navigate(-1)}
            variant="contained"
            color="primary"
          >
            Go back
          </Button>
        </div>
      )
    }
    return (
      <div style={styles.infoContainer}>
        <Box mb={2}>
          <Typography variant="h6" align="center">
            Oups!
          </Typography>
          <Typography align="center">
            Sorry it looks like we are unable to load the book. If the problem
            persist try to restart the app. If it still does not work,{" "}
            <Link
              href="https://docs.oboku.me/support"
              target="__blank"
              underline="hover"
            >
              contact us
            </Link>
          </Typography>
        </Box>
        <Button
          onClick={() => navigate(-1)}
          variant="contained"
          color="primary"
        >
          Go back
        </Button>
      </div>
    )
  }

  return (
    <div
      style={{
        position: "relative",
        height: `100%`,
        width: `100%`
      }}
      ref={containerMeasureRef as any}
    >
      <div
        style={{
          height: `100%`,
          width: `100%`,
          position: "relative"
        }}
        ref={(ref) => {
          if (ref && !readerContainerHammer) {
            const hammerInstance = new Hammer(ref)

            // @see https://hammerjs.github.io/recognizer-pinch/
            hammerInstance.get("pinch").set({ enable: true })

            setReaderContainerHammer(hammerInstance)
          }
        }}
      >
        {!!loadOptions && !!readerOptions && (
          <ObokuReader
            options={readerOptions}
            manifest={manifest}
            loadOptions={loadOptions}
            onReady={onBookReady}
            onReader={setReader}
            createReader={createAppReader}
          />
        )}
        {!isBookReady && <BookLoading />}
      </div>
      <Notification />
      {showFloatingMenu && (
        <FloatingBottom
          enableProgress={readerSettings.floatingProgress === "bottom"}
          enableTime={readerSettings.floatingTime === "bottom"}
        />
      )}
      <TopBar />
      <BottomBar />
    </div>
  )
})

const useStyles = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      infoContainer: {
        margin: "auto",
        maxWidth: 500,
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column"
      }
    }),
    [theme]
  )
}
