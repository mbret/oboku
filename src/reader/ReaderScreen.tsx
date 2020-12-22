/**
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js#L407-L469
 */
import React, { useState, useEffect, useRef, useCallback, FC } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import localforage from 'localforage';
import { EpubView } from './EpubView'
import { useDebounce, useThrottleFn, useWindowSize } from "react-use";
import { Box, Button, Divider, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography } from '@material-ui/core';
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
import { bookState } from '../books/states';
import { ReadingStateState } from 'oboku-shared'
import { currentApproximateProgressState, currentChapterState, currentLocationState, currentPageState, isMenuShownState, layoutState, tocState, totalApproximativePagesState } from './states';
import { Menu } from './Menu';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { useGenerateLocations, useResetStateOnUnmount, useUpdateBookState } from './helpers';
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
  const { bookId } = useParams<{ bookId?: string }>()
  const { file, error: fileError } = useFile(bookId || '-1')
  const [isTopMenuShown, setIsTopMenuShown] = useState(false)
  const [isBottomMenuShown, setIsBottomMenuShown] = useState(false)
  const book = useRecoilValue(bookState(bookId || '-1'))
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
  const firstLocation = useRef(book?.readingStateCurrentBookmarkLocation || undefined)
  const history = useHistory()

  useGenerateLocations(rendition)
  useResetStateOnUnmount()

  // @todo only show menu on short click
  const onRenditionClick = useCallback((e: MouseEvent) => {
    const { offsetX, offsetY, clientX, clientY, x, screenX, pageX, movementX } = e
    const location = rendition?.currentLocation() as any
    const start = location.start as any
    const pageDisplayedIndex = start.displayed.page - 1

    // let wrapper = rendition?.manager?.container;

    // let realClientXOffset = clientX - (windowSize.width * pageDisplayedIndex)
    let realClientXOffset = clientX

    const iframeBoundingClientRect = e.view?.frameElement?.getBoundingClientRect()

    // const epubViewContainer = e.target?.querySelector("p").closest(".near.ancestor")
    // For now comic reader only render current page so there
    // are no issue with weird offset
    if (isUsingComicReader) {
      realClientXOffset = clientX
    }

    if (iframeBoundingClientRect) {
      realClientXOffset += iframeBoundingClientRect.left
    }

    const maxOffsetPrev = horizontalTappingZoneWidth
    const maxOffsetBottomMenu = verticalTappingZoneHeight
    const minOffsetNext = windowSize.width - maxOffsetPrev
    const minOffsetBottomMenu = windowSize.height - maxOffsetBottomMenu

    console.log(
      'mouse',
      clientX,
      iframeBoundingClientRect,
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
    rendition?.on('click', onRenditionClick)

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
      rendition?.off('click', onRenditionClick)
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
      updateProgress(location)
    }

    rendition?.on('relocated', onRelocated);

    return () => rendition?.off('relocated', onRelocated)
  }, [rendition, editBook, bookId, book, updateProgress, setCurrentLocation])

  useUpdateBookState(bookId || '-1')

  console.log('[ReaderScreen]', {
    rendition,
    book,
  })

  if (fileError) {
    return (
      <Box display="flex" flex={1} alignItems="center" justifyContent="center" flexDirection="column">
        <Box mb={2}>
          <Typography variant="h6" align="center">Oups!</Typography>
          <Typography align="center">Sorry it looks like we are unable to load the book</Typography>
        </Box>
        <Button onClick={() => history.goBack()} variant="contained" color="primary">Go back</Button>
      </Box>
    )
  }

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
          {/* 
            This div is used to capture click event in case where epubjs does not cover the
            entire screen with its iframe. It does happens for example when a fixed layout is on spread
            mode but there is only one page. There will be one half of the screen empty and therefore
            no rendition.on.click event.
          */}
          <div
            style={{
              height: windowSize.height,
              width: windowSize.width,
              position: "relative",
            }}
            onClick={e => onRenditionClick(e.nativeEvent)}
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
                    // spread: 'never' // never / always
                    // stylesheet: 'html { display: none; } ',
                  }}
                  loadingView={(
                    <div>
                      Book is loading
                    </div>
                  )}
                  location={firstLocation.current}
                />
              )
              : (
                <ComicReader
                  url={file}
                  getRendition={setRendition as any}
                  location={firstLocation.current}
                />
              )}
          </div>
          <TopBar />
          <BottomBar />
        </div>
      )}
      <AppTourReader />
    </ReaderProvider>
  )
}

const useFile = (bookId: string) => {
  const [file, setFile] = useState<Blob | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)

  useEffect(() => {
    (async () => {
      const data = await localforage.getItem<Blob>(`book-download-${bookId}`)
      if (!data) {
        setError(new Error('Unable to load file'))
      } else {
        setFile(data)
      }
    })()
  }, [bookId])

  return { file, error }
}

const useVerticalCentererRendererHook = (rendition: Rendition | undefined) => {
  const layout = useRecoilValue(layoutState)

  useEffect(() => {
    const hook = (contents: Contents, view) => {
      const $bodyList = contents.document.getElementsByTagName('body')
      const $body = $bodyList.item(0)
      const windowInnerHeight = contents.window.innerHeight
      const windowInnerWidth = contents.window.innerWidth

      if ($body) {
        const height = $body.getBoundingClientRect().height
        const width = $body.getBoundingClientRect().width
        var scaleX = $body.getBoundingClientRect().width / $body.offsetWidth;

        // align vertically the body in case of content height is lower
        if (height < windowInnerHeight) {
          console.log(windowInnerHeight, height, windowInnerHeight - height, (windowInnerHeight - height) / 2, scaleX)
          $body.style.paddingTop = `${((windowInnerHeight - height) / 2) / scaleX}px`
          console.warn(`useVerticalCentererRendererHook -> re-center with padding of ${$body.style.paddingTop}`)
        }

        // align vertically the body in case of content height is lower
        if (width < windowInnerWidth) {
          // console.log(windowInnerHeight, height, windowInnerHeight - height, (windowInnerHeight - height) / 2, scaleX)
          $body.style.paddingLeft = `${((windowInnerWidth - width) / 2) / scaleX}px`
          console.warn(`useVerticalCentererRendererHook -> re-center with padding of ${$body.style.paddingTop}`)
        }
      }
    }

    if (layout === 'fixed') {
      rendition?.hooks.content.register(hook)
    }

    return () => {
      rendition?.hooks.content.deregister(hook)
    }
  }, [rendition, layout])
}