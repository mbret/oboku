import { useRecoilCallback, useRecoilValue } from "recoil"
import * as states from "./states"
import { Rendition } from "epubjs"
import { useEffect, useState } from "react"
import { useUpdateBook } from "../books/helpers"
import { ReadingStateState } from "@oboku/shared"
import { useDebounce } from "react-use"
import { useBookFile } from "../download/useBookFile"

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
  const [editBook] = useUpdateBook()
  const currentLocationToWatch = useRecoilValue(states.currentLocationState)

  const updateBook = useRecoilCallback(({ snapshot }) => async () => {
    const currentLocation = await snapshot.getPromise(states.currentLocationState)
    const currentApproximateProgress = await snapshot.getPromise(states.currentApproximateProgressState)

    if (currentLocation) {
      editBook({
        _id: bookId,
        readingStateCurrentBookmarkLocation: currentLocation?.start?.cfi,
        readingStateCurrentBookmarkProgressUpdatedAt: (new Date()).toISOString(),
        readingStateCurrentState: ReadingStateState.Reading,
        ...currentApproximateProgress && {
          readingStateCurrentBookmarkProgressPercent: currentApproximateProgress,
        },
        ...currentApproximateProgress === 1 && {
          readingStateCurrentState: ReadingStateState.Finished,
        }
      })
    }
  }, [editBook])

  useDebounce(updateBook, 400, [currentLocationToWatch, updateBook])
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
