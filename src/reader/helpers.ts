import { useRecoilCallback, useRecoilValue } from "recoil"
import * as states from "./states"
import { Rendition } from "epubjs"
import { useEffect, useState } from "react"
import { useUpdateBook } from "../books/helpers"
import { bookState } from "../books/states"
import { ReadingStateState } from "oboku-shared"
import { useDebounce } from "react-use"
import localforage from 'localforage'

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
    const book = await snapshot.getPromise(bookState(bookId))
    const readingStateCurrentBookmarkLocation = book?.readingStateCurrentBookmarkLocation

    if (currentLocation && currentLocation?.start?.cfi !== readingStateCurrentBookmarkLocation) {
      editBook({
        _id: bookId,
        readingStateCurrentBookmarkLocation: currentLocation?.start?.cfi,
        readingStateCurrentState: ReadingStateState.Reading,
        ...currentApproximateProgress && {
          // progress
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

// const comicMimeTypes = ['application/x-cbz']
const epubMimeTypes = ['application/epub+zip']

export const useFile = (bookId: string) => {
  const [data, setData] = useState<{ file?: Blob | undefined, reader?: 'comic' | 'epub', error?: Error | undefined }>({})

  useEffect(() => {
    (async () => {
      const data = await localforage.getItem<Blob>(`book-download-${bookId}`)
      if (!data) {
        setData(prev => ({ ...prev, error: new Error('Unable to load file') }))
      } else {
        if (epubMimeTypes.includes(data.type) || (data instanceof File && data.name.endsWith('.epub'))) {
          setData(prev => ({ ...prev, file: data, reader: 'epub', error: undefined }))
        } else {
          setData(prev => ({ ...prev, file: data, reader: 'comic', error: undefined }))
        }
      }
    })()
  }, [bookId])

  return data
}
