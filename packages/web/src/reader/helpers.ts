import { useRecoilCallback, useRecoilValue, useSetRecoilState } from "recoil"
import * as states from "./states"
import { Rendition } from "epubjs"
import { useEffect, useMemo, useState } from "react"
import { useAtomicUpdateBook } from "../books/helpers"
import { ReadingStateState } from "@oboku/shared"
import { useDebounce, useWindowSize } from "react-use"
import { useBookFile } from "../download/useBookFile"
import { useHorizontalTappingZoneWidth } from "./utils"

const statesToReset = [
  states.currentApproximateProgressState,
  states.currentChapterState,
  states.currentLocationState,
  states.currentPageState,
  states.tocState,
  states.layoutState,
  states.isMenuShownState,
  states.totalApproximativePagesState,
]

export const useResetStateOnUnmount = () => {
  const resetStates = useRecoilCallback(({ reset }) => () => {
    statesToReset.forEach(state => reset(state))
  }, [])

  useEffect(() => {
    return () => resetStates()
  }, [resetStates])
}

export const useResizeBook = (rendition: Rendition | undefined, containerWidth: number, containerHeight: number) => {
  const isBookReady = useRecoilValue(states.isBookReadyState)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (isBookReady && rendition) {
      timeout = setTimeout(() => {
        rendition.resize(containerWidth, containerHeight)
      }, 100)
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [rendition, containerWidth, containerHeight, isBookReady])
}

/**
 * Generate good enough page range for progress and current page.
 * We use 600 char as breaker as it's a good enough middle. 
 * @todo optimize to retrieve from storage
 * @see https://github.com/futurepress/epub.js/blob/master/examples/locations.html
 */
export const useGenerateLocations = (rendition: Rendition | undefined, words = 300) => {
  const [locations, setLocations] = useState<string[] | undefined>(undefined)
  const layout = useRecoilValue(states.layoutState)

  useEffect(() => {
    if (!rendition || layout !== 'reflow') return

    (async () => {
      await rendition.book.ready

      // if we call generate again for some reason the locations will stack on top of each other
      // so we clean them before every generation
      rendition.book.locations.load(JSON.stringify([]))

      // Generates CFI for every X characters (Characters per/page)
      // await rendition?.book.locations.generate(600)
      const locations = await (rendition?.book.locations.generate(words) as Promise<string[]>)

      setLocations(locations)

      // Will trigger a relocate
      rendition.reportLocation()
    })()
  }, [rendition, words, layout])

  return locations
}

export const useUpdateBookState = (bookId: string) => {
  const [updateBook] = useAtomicUpdateBook()
  const currentLocationToWatch = useRecoilValue(states.currentLocationState)

  const updater = useRecoilCallback(({ snapshot }) => async () => {
    const currentLocation = await snapshot.getPromise(states.currentLocationState)
    const currentApproximateProgress = await snapshot.getPromise(states.currentApproximateProgressState)

    if (currentLocation) {
      updateBook(bookId, old => ({
        ...old,
        readingStateCurrentBookmarkLocation: currentLocation?.start?.cfi,
        readingStateCurrentBookmarkProgressUpdatedAt: (new Date()).toISOString(),
        ...(old.readingStateCurrentState !== ReadingStateState.Finished) && {
          readingStateCurrentState: ReadingStateState.Reading,
          ...currentApproximateProgress === 1 && {
            readingStateCurrentState: ReadingStateState.Finished,
          }
        },
        ...(typeof currentApproximateProgress === 'number') && {
          readingStateCurrentBookmarkProgressPercent: currentApproximateProgress,
        },
      }))
    }
  }, [updateBook, bookId])

  useDebounce(updater, 400, [currentLocationToWatch, updater])
}

const epubMimeTypes = ['application/epub+zip']

export const useFile = (bookId: string) => {
  const file = useBookFile(bookId)
  const [data, setData] = useState<{
    file?: Blob | undefined,
    filename?: string,
    documentType?: 'comic' | 'epub' | 'unknown',
    error?: Error | undefined
  }>({})

  useEffect(() => {
    (async () => {
      if (file === null) {
        setData(prev => ({ ...prev, error: new Error('Unable to load file') }))
      } else if (file) {
        const normalizedName = file.name.toLowerCase()
        if (epubMimeTypes.includes(file.data.type) || normalizedName.endsWith('.epub')) {
          setData(prev => ({ ...prev, file: file.data, documentType: 'epub', error: undefined, filename: normalizedName }))
        } else if (
          ['text/xml'].includes(file.data.type)
          || (
            normalizedName.endsWith('.cbz')
            || normalizedName.endsWith('.cbr')
            || normalizedName.endsWith('.txt')
          )
          || (file.data instanceof File
            && (
              normalizedName.endsWith('.cbz')
              || normalizedName.endsWith('.cbr')
              || normalizedName.endsWith('.txt')))
        ) {
          setData(prev => ({ ...prev, file: file.data, documentType: 'comic', error: undefined, filename: normalizedName }))
        } else {
          setData(prev => ({ ...prev, file: file.data, documentType: 'unknown', error: undefined, filename: normalizedName }))
        }
      }
    })()
  }, [file])

  return data
}

export const useGestureHandler = (rendition: Rendition | undefined, hammer: HammerManager | undefined, documentType: "comic" | "epub" | "unknown" | undefined) => {
  const navigator = useNavigator(rendition)
  const windowSize = useWindowSize()
  const horizontalTappingZoneWidth = useHorizontalTappingZoneWidth()
  const setIsMenuShown = useSetRecoilState(states.isMenuShownState)
  
  useEffect(() => {
    const onPanMove = (ev: HammerInput) => {
      console.log(`onPanMove`, ev.velocityX)
      if (ev.isFinal) {
        const velocity = ev.velocityX
        if (velocity < -0.5) {
          navigator.turnRight()
        }
        if (velocity > 0.5) {
          navigator.turnLeft()
        }
      }
    }

    /**
     * Beware that this event can come from both reader container and
     * from within the epubjs iframe.
     */
    const onTap = (ev: HammerInput) => {
      console.log(`onTap`, ev)
      const { x: clientX } = ev.center

      // let wrapper = rendition?.manager?.container;
  
      // let realClientXOffset = clientX - (windowSize.width * pageDisplayedIndex)
      let realClientXOffset = clientX
  
      const iframeBoundingClientRect = ev.target.ownerDocument.defaultView?.frameElement?.getBoundingClientRect()
  
      // const epubViewContainer = e.target?.querySelector("p").closest(".near.ancestor")
      // For now comic reader only render current page so there
      // are no issue with weird offset
      if (documentType === 'comic') {
        realClientXOffset = clientX
      }
  
      if (iframeBoundingClientRect) {
        realClientXOffset += iframeBoundingClientRect.left
      }
  
      const maxOffsetPrev = horizontalTappingZoneWidth
      // const maxOffsetBottomMenu = verticalTappingZoneHeight
      const minOffsetNext = windowSize.width - maxOffsetPrev
      // const minOffsetBottomMenu = windowSize.height - maxOffsetBottomMenu
  
      console.log(
        'mouse',
        clientX,
        iframeBoundingClientRect,
        realClientXOffset,
        maxOffsetPrev,
      )
  
      if (realClientXOffset < maxOffsetPrev) {
        navigator.turnLeft()
      } else if (realClientXOffset > minOffsetNext) {
        navigator.turnRight()
      } else {
        setIsMenuShown(val => !val)
      }
  
      // else if (clientY < maxOffsetBottomMenu) {
      //   setIsTopMenuShown(true)
      // } else if (clientY > minOffsetBottomMenu) {
      //   setIsBottomMenuShown(true)
      // }
    }

    const onPanMoveEpubjsEvent: any = ({ detail: ev }: { detail: HammerInput }) => onPanMove(ev)
    const onTapEpubjsEvent: any = ({ detail: ev }: { detail: HammerInput }) => onTap(ev)

    window.document.addEventListener('hammer panmove panstart panend', onPanMoveEpubjsEvent, true)
    window.document.addEventListener('hammer tap', onTapEpubjsEvent, true)
    hammer?.on('panmove panstart panend', onPanMove)
    hammer?.on('tap', onTap)

    return () => {
      window.document.removeEventListener('hammer panmove panstart panend', onPanMoveEpubjsEvent, true)
      window.document.removeEventListener('hammer tap', onTapEpubjsEvent, true)
      hammer?.off('panmove panstart panend', onPanMove)
      hammer?.off('tap', onTap)
    }
  }, [rendition, hammer, navigator, horizontalTappingZoneWidth, documentType, setIsMenuShown, windowSize.width])
}

export const useNavigator = (rendition: Rendition | undefined) => {
  const direction = useRecoilValue(states.currentDirectionState)

  return useMemo(() => ({
    turnRight: () => {
      if (direction === 'ltr') rendition?.next()
      else rendition?.prev()
    },
    turnLeft: () => {
      if (direction === 'ltr') rendition?.prev()
      else rendition?.next()
    }
  }), [direction, rendition])
}