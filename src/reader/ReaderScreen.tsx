/**
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js#L407-L469
 */
import React, { useState, useEffect, useRef, useCallback, FC } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import localforage from 'localforage';
import { EpubView } from './EpubView'
import { useDebounce, useThrottleFn, useWindowSize } from "react-use";
import { Divider, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar } from '@material-ui/core';
import { ArrowBackIosRounded } from '@material-ui/icons';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import { Rendition } from "epubjs";
import { Contents, Location } from "epubjs";
import { useUpdateBook } from '../books/helpers';
import { AppTourReader } from '../firstTimeExperience/AppTourReader';
import { useHorizontalTappingZoneWidth, useVerticalTappingZoneHeight } from './utils';
import { PromiseReturnType } from '../types';
import { PageNumber } from './PageNumber';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { normalizedBooksState } from '../books/states';
import { ReadingStateState } from 'oboku-shared'
import { currentApproximateProgressState, currentChapterState, currentLocationState, currentPageState, isMenuShownState, layoutState, tocState, totalApproximativePagesState } from './states';
import { Menu } from './Menu';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { useGenerateLocations, useResetStates } from './helpers';
import { ReaderProvider } from './ReaderProvider';
import { ComicReader } from './comic/ComicReader';
import { clone } from 'ramda';
import { concatMapTo } from 'rxjs/operators';

type ReaderInstance = {
  nextPage: () => void,
  prevPage: () => void,
}

// function toggleFullScreen() {
//   var doc = window.document;
//   var docEl = doc.documentElement;

//   var requestFullScreen = docEl.requestFullscreen || (docEl as any).mozRequestFullScreen || (docEl as any).webkitRequestFullScreen || (docEl as any).msRequestFullscreen;
//   var cancelFullScreen = doc.exitFullscreen || (doc as any).mozCancelFullScreen || (doc as any).webkitExitFullscreen || (doc as any).msExitFullscreen;

//   if (!doc.fullscreenElement && !(doc as any).mozFullScreenElement && !(doc as any).webkitFullscreenElement && !(doc as any).msFullscreenElement) {
//     requestFullScreen.call(docEl);
//   }
//   else {
//     cancelFullScreen.call(doc);
//   }
// }

const comicMimeTypes = ['application/x-cbz']

export const ReaderScreen: FC<{}> = () => {
  const readerRef = useRef<any>()
  const rootRef = useRef<HTMLDivElement>()

  const setCurrentApproximateProgress = useSetRecoilState(currentApproximateProgressState)
  const [generatedLocations, setGeneratedLocations] = useState<string[]>([])
  const [rendition, setRendition] = useState<Rendition | undefined>(undefined)
  const { bookId } = useParams<any>()
  const file = useFile(bookId)
  const [isTopMenuShown, setIsTopMenuShown] = useState(false)
  const [isBottomMenuShown, setIsBottomMenuShown] = useState(false)
  const book = useRecoilValue(normalizedBooksState)[bookId || '-1']
  const windowSize = useWindowSize()
  const [editBook] = useUpdateBook()
  const verticalTappingZoneHeight = useVerticalTappingZoneHeight()
  const horizontalTappingZoneWidth = useHorizontalTappingZoneWidth()
  const [isMenuShow, setIsMenuShown] = useRecoilState(isMenuShownState)
  const [layout, setLayout] = useRecoilState(layoutState)
  const setCurrentPage = useSetRecoilState(currentPageState)
  const setTotalApproximativePages = useSetRecoilState(totalApproximativePagesState)
  const [toc, setToc] = useRecoilState(tocState)
  const [currentLocation, setCurrentLocation] = useRecoilState(currentLocationState)
  const setCurrentChapter = useSetRecoilState(currentChapterState)
  const isUsingComicReader = comicMimeTypes.includes(file?.type || '')
  const resetStates = useResetStates()

  useGenerateLocations(rendition)

  useEffect(() => {
    return () => {
      console.warn('resetStates')
      resetStates()
    }
  }, [resetStates])

  // useEffect(() => {
  //   document.documentElement.requestFullscreen().catch(console.error)
  // }, [])

  // useEffect(() => {
  //   toggleFullScreen()
  // }, [isMenuShow])

  // @todo only show menu on short click
  const onRenditionClick = useCallback((e: MouseEvent) => {
    const { offsetX, offsetY, clientX, clientY, x, screenX, pageX, movementX, layerX } = e as any
    const location = rendition?.currentLocation() as any
    const start = location.start as any
    const pageDisplayedIndex = start.displayed.page - 1

    let realClientXOffset = clientX - (windowSize.width * pageDisplayedIndex)

    // For now comic reader only render current page so there
    // are no issue with weird offset
    if (isUsingComicReader) {
      realClientXOffset = clientX
    }

    const maxOffsetPrev = horizontalTappingZoneWidth
    const maxOffsetBottomMenu = verticalTappingZoneHeight
    const minOffsetNext = windowSize.width - maxOffsetPrev
    const minOffsetBottomMenu = windowSize.height - maxOffsetBottomMenu

    console.log(
      'mouse',
      clientX,
      realClientXOffset,
      maxOffsetPrev,
    )

    if (realClientXOffset < maxOffsetPrev) {
      rendition?.prev()
    } else if (realClientXOffset > minOffsetNext) {
      rendition?.next()
    } else {
      setIsMenuShown(val => !val)
    }

    // else if (clientY < maxOffsetBottomMenu) {
    //   setIsTopMenuShown(true)
    // } else if (clientY > minOffsetBottomMenu) {
    //   setIsBottomMenuShown(true)
    // }
  }, [windowSize, verticalTappingZoneHeight, horizontalTappingZoneWidth, rendition, setIsMenuShown, isUsingComicReader])

  // @ts-ignore
  window.rendition = rendition;

  useEffect(() => {
    if (!rendition) return

    const href = currentLocation?.start.href

    if (href) {
      setCurrentChapter(rendition.book.navigation.get(href))
    }
  }, [rendition, currentLocation, setCurrentChapter])

  useEffect(() => {
    const onClick = e => onRenditionClick(e)
    rendition?.on('click', onClick)

    rendition?.on('displayError', e => {
      console.warn('displayError', e)
    })

    if (rendition) {
      if (
        (rendition.book as any)?.displayOptions.fixedLayout === 'true'
        || rendition.book.packaging.metadata?.layout === 'pre-paginated') {
        setLayout('fixed')
      } else {
        setLayout('reflow')
      }
    }

    return () => {
      rendition?.off('click', onClick)
    }
  }, [rendition, onRenditionClick, setLayout])

  useEffect(() => {
    if (!rendition) return
    (async () => {
      const { toc } = await rendition.book.loaded.navigation
      console.warn(toc)
      setToc(toc)
    })()
  }, [rendition, setToc])

  // const onLocationChanged = (epubcifi: string) => {
  //   console.log(
  //     `onLocationChanged`,
  //     epubcifi,
  //     rendition?.book.locations.locationFromCfi(epubcifi),
  //     rendition?.book.locations.currentLocation,
  //     // rendition?.book.locations.percentageFromLocation(epubcifi),
  //     rendition?.book.locations.percentageFromCfi(epubcifi),
  //   )
  //   editBook({
  //     variables: {
  //       id: bookId,
  //       readingStateCurrentBookmarkLocation: epubcifi as string
  //     }
  //   })
  // }

  useVerticalCentererRendererHook(rendition)

  useEffect(() => {
    rendition?.hooks.content.register(function (contents, b) {
      contents.content.setAttribute('tabindex', '-1')
    })
  }, [rendition])

  const updateProgress = useCallback((currentLocation: any | undefined) => {
    /**
     * Comic detected
     * For comic the rendering does not work and will always return page number of 0
     * and a location of -1. We just get the number of pages based on spine and the current index.
     * If the book is fully pre-paginated the number of pages should not change anyway.
     */

    if (layout === 'fixed') {
      const pageNumber = (currentLocation?.start?.index || 0)
      const spineLength = rendition?.book?.packaging?.spine?.length || 0
      setCurrentPage(pageNumber)
      console.log(currentLocation)
      setTotalApproximativePages(rendition?.book.packaging.spine.length)
      setCurrentApproximateProgress(pageNumber / (spineLength - 1))
    } else {
      const _currentPage = currentLocation?.atEnd
        ? currentLocation?.end?.location
        : rendition?.book.locations.locationFromCfi(currentLocation?.start?.cfi) as unknown as number

      if (currentLocation && _currentPage > -1) {
        const progress = rendition?.book.locations.percentageFromCfi(currentLocation?.start?.cfi);
        const finalProgress = currentLocation?.atEnd ? 1 : progress
        // The % of how far along in the book you are
        setCurrentApproximateProgress(finalProgress)
        setCurrentPage(_currentPage)
        setTotalApproximativePages((rendition?.book.locations as any)?.total)
      }
    }
  }, [rendition, layout, setCurrentPage, setTotalApproximativePages, setCurrentApproximateProgress])

  useEffect(() => {

    const onRelocated = async (location: Location) => {
      const newLocation = await rendition?.currentLocation() as any
      setCurrentLocation(clone(newLocation))

      const currentStartIndex = location?.start.index
      // let progress: number | undefined

      console.log(`onRelocated`,
        location,
        rendition?.book.packaging.metadata.layout,
        rendition?.book.packaging,
        await rendition?.book.getRange(location.start.cfi),
        rendition?.book.locations,
        // progress,
      )
      //   console.log(`relocated`, location)
      // @see https://github.com/futurepress/epub.js/issues/278. It needs to load all locations
      // progress = rendition?.book.locations.percentageFromCfi(location.start.cfi);
      // const finalProgress = location.atEnd ? 1 : progress
      // console.log('Progress:', finalProgress); // The % of how far along in the book you are
      // console.log('Current Page:', rendition?.book.locations.locationFromCfi(location.start.cfi))
      // console.log('Total Pages:', (rendition?.book.locations as any)?.total);

      updateProgress(location)
    }

    rendition?.on('relocated', onRelocated);

    return () => rendition?.off('relocated', onRelocated)
  }, [rendition, editBook, bookId, book, updateProgress, setCurrentLocation])

  useUpdateBookState(bookId)

  console.log('[ReaderScreen]', {
    rendition,
  })

  // console.log(file)
  return (
    <ReaderProvider rendition={rendition}>
      {file && (
        <div
          style={{
            position: "relative",
            height: windowSize.height,
            width: windowSize.width,
          }}
          ref={rootRef as any}
        >
          {!isUsingComicReader
            ? (
              <EpubView
                // http://epubjs.org/documentation/0.3/#bookrenderto
                ref={readerRef as any}
                // Bug in typing, epubjs accept blobs
                url={file as any}
                getRendition={setRendition}
                epubOptions={{
                  stylesheet: 'html { display: none; } ',

                }}
                loadingView={(
                  <div>
                    Book is loading
                  </div>
                )}
                location={book?.readingStateCurrentBookmarkLocation || undefined}
              />
            )
            : (
              <ComicReader
                url={file}
                getRendition={setRendition as any}
                location={book?.readingStateCurrentBookmarkLocation || undefined}
              />
            )}
          <TopBar />
          <BottomBar />
        </div>
      )}
      <AppTourReader />
    </ReaderProvider>
  )
}

const useFile = (bookId) => {
  const [file, setFile] = useState<Blob | undefined>(undefined)

  useEffect(() => {
    (async () => {
      const data = await localforage.getItem<Blob>(`book-download-${bookId}`)
      if (data) {
        setFile(data)
      }
    })()
  }, [bookId])

  return file
}

const useVerticalCentererRendererHook = (rendition: Rendition | undefined) => {
  useEffect(() => {
    const hook = (contents: Contents, view) => {
      const $bodyList = contents.document.getElementsByTagName('body')
      const $body = $bodyList.item(0)
      const windowInnerHeight = contents.window.innerHeight

      if ($body) {
        const height = $body.getBoundingClientRect().height
        var scaleX = $body.getBoundingClientRect().width / $body.offsetWidth;
        if (height < windowInnerHeight) {
          console.log(windowInnerHeight, height, windowInnerHeight - height, (windowInnerHeight - height) / 2, scaleX)
          $body.style.paddingTop = `${((windowInnerHeight - height) / 2) / scaleX}px`
          console.warn(`useVerticalCentererRendererHook -> re-center with padding of ${$body.style.paddingTop}`)
        }
      }
    }

    rendition?.hooks.content.register(hook)

    return () => {
      rendition?.hooks.content.deregister(hook)
    }
  }, [rendition])
}

const useUpdateBookState = (bookId: string) => {
  const [editBook] = useUpdateBook()
  const currentLocation = useRecoilValue(currentLocationState)
  const currentApproximateProgress = useRecoilValue(currentApproximateProgressState)
  const book = useRecoilValue(normalizedBooksState)[bookId || '-1']
  const readingStateCurrentBookmarkLocation = book?.readingStateCurrentBookmarkLocation

  useDebounce(() => {
    console.log(currentApproximateProgress)
    console.log(readingStateCurrentBookmarkLocation)
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
  }, 400, [currentApproximateProgress, currentLocation, readingStateCurrentBookmarkLocation] as any)
}