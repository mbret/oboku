import React, { useState, useEffect, useRef, useCallback, FC } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import localforage from 'localforage';
import { EpubView } from "react-reader";
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
import { useRecoilValue } from 'recoil';
import { normalizedBooksState } from '../books/states';
import { ReadingStateState } from 'oboku-shared'

type ReaderInstance = {
  nextPage: () => void,
  prevPage: () => void,
}

export const ReaderScreen: FC<{}> = () => {
  const readerRef = useRef<any>()
  const rootRef = useRef<HTMLDivElement>()
  const history = useHistory()
  const [currentLocation, setCurrentLocation] = useState<any | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState<undefined | number>(undefined)
  const [totalPages, setTotalPages] = useState<undefined | number>(undefined)
  const [progress, setProgress] = useState<number | undefined>(undefined)
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

  const isReflow = (rendition?.book as any)?.displayOptions.fixedLayout !== 'true'

  const next = useCallback(() => {
    console.log('next')
    // readerRef.current?.nextPage();
    rendition?.next()
    // rendition?.prev()
  }, [rendition]);

  const prev = useCallback(() => {
    console.log('prev')
    // readerRef.current?.nextPage();
    rendition?.prev()
  }, [rendition]);

  // @todo only show menu on short click
  const onRenditionClick = useCallback((e: MouseEvent) => {
    const { offsetX, offsetY, clientX, clientY, x, screenX, pageX, movementX, layerX } = e as any
    const location = rendition?.currentLocation() as any
    const start = location.start as any
    const pageDisplayedIndex = start.displayed.page - 1
    const realClientXOffset = clientX - (windowSize.width * pageDisplayedIndex)
    console.log('mouse', clientX, clientX - (windowSize.width * pageDisplayedIndex), rendition?.getContents(), location)
    const maxOffsetPrev = horizontalTappingZoneWidth
    const maxOffsetBottomMenu = verticalTappingZoneHeight
    const minOffsetNext = windowSize.width - maxOffsetPrev
    const minOffsetBottomMenu = windowSize.height - maxOffsetBottomMenu
    if (realClientXOffset < maxOffsetPrev) {
      prev()
    } else if (realClientXOffset > minOffsetNext) {
      next()
    }
    else if (clientY < maxOffsetBottomMenu) {
      setIsTopMenuShown(true)
    } else if (clientY > minOffsetBottomMenu) {
      setIsBottomMenuShown(true)
    }
  }, [windowSize, verticalTappingZoneHeight, next, prev, horizontalTappingZoneWidth, rendition])

  useEffect(() => {

    setTimeout(() => {
      // rendition && prev()

    }, 1000)
    // rootRef.current?.addEventListener('click', (e) => {
    // document.addEventListener('click', (e) => {
    //   console.log(e)
    // })
    const onClick = e => onRenditionClick(e)
    rendition?.on('click', onClick)

    return () => {
      rendition?.off('click', onClick)
    }
  }, [rendition, onRenditionClick, next])

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

  const updateProgress = useCallback((currentLocation: any | undefined) => {
    /**
     * Comic detected
     * For comic the rendering does not work and will always return page number of 0
     * and a location of -1. We just get the number of pages based on spine and the current index.
     * If the book is fully pre-paginated the number of pages should not change anyway.
     */
    if (!isReflow) {
      const pageNumber = (currentLocation?.start?.index || 0) + 1
      setCurrentPage(pageNumber)
      setTotalPages(rendition?.book.packaging.spine.length)
      setProgress(pageNumber / (rendition?.book?.packaging?.spine?.length || 0))
    } else {
      const _currentPage = currentLocation?.atEnd
        ? currentLocation?.end?.location
        : rendition?.book.locations.locationFromCfi(currentLocation?.start?.cfi) as unknown as number
      if (currentLocation && _currentPage > -1) {
        const progress = rendition?.book.locations.percentageFromCfi(currentLocation?.start?.cfi);
        const finalProgress = currentLocation?.atEnd ? 1 : progress
        // The % of how far along in the book you are
        setProgress(finalProgress)
        setCurrentPage(_currentPage)
        setTotalPages((rendition?.book.locations as any)?.total)
      }
    }
  }, [rendition, isReflow])

  /**
   * Generate good enough page range for progress and current page.
   * We use 600 char as breaker as it's a good enough middle. 
   * @todo optimize to retrieve from storage
   */
  useEffect(() => {
    (async () => {
      await rendition?.book.ready
      // Generates CFI for every X characters (Characters per/page)
      await rendition?.book.locations.generate(600)

      // Will trigger a relocate
      rendition?.reportLocation()
    })()
  }, [rendition, updateProgress])


  useEffect(() => {

    const onRelocated = async (location: Location) => {
      setCurrentLocation(await rendition?.currentLocation() as any)

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

    // rendition?.on('resized', (e) => {
    //   console.log('resized', e)
    // })

    // rendition?.on('locationChanged', (e) => {
    //   console.log('locationChanged', e)
    // })

    // rendition?.on('displayed', (e) => {
    //   console.log('displayed', e)
    // })

    return () => rendition?.off('relocated', onRelocated)
  }, [rendition, editBook, bookId, book, updateProgress, progress])

  useUpdateBookState(bookId, progress, currentLocation)

  console.log('[ReaderScreen]', {
    progress,
    currentPage,
    totalPages,
    rendition,
    currentLocation,
    // currentPosition: Math.floor(generatedLocations.length * (currentLocation?.start.percentage.toFixed(4))),
    // currentProgress: Math.floor(currentLocation?.start.percentage.toFixed(4) * 100),
    // generatedLocations
  })

  return (
    <>
      {file && (
        <div
          style={{
            position: "relative",
            height: windowSize.height,
            width: windowSize.width,
          }}
          ref={rootRef as any}
        >
          <EpubView
            ref={readerRef as any}
            // Bug in typing, epubjs accept blobs
            url={file as any}
            getRendition={setRendition}
            epubInitOptions={{

            }}
            // http://epubjs.org/documentation/0.3/#bookrenderto
            epubOptions={{
              // height: 600,
              // width: 300,
              // flow: 'paginated',
              // width: "100%",
              // height: "100%",
              // stylesheet: `/reader.css`,
              // defaultDirection: 'rtl'
            }}
            loadingView={(
              <div>
                Book is loading
              </div>
            )}
            location={book?.readingStateCurrentBookmarkLocation || undefined}
          />
          <Drawer
            anchor="top"
            open={isTopMenuShown}
            onClose={() => setIsTopMenuShown(false)}
            transitionDuration={0}
          >
            <Toolbar>
              <IconButton
                edge="start"
                onClick={() => {
                  history.goBack()
                }}
              >
                <ArrowBackIosRounded />
              </IconButton>
            </Toolbar>
          </Drawer>
          <Drawer
            anchor="bottom"
            open={isBottomMenuShown}
            onClose={() => setIsBottomMenuShown(false)}
            transitionDuration={0}
          >
            <PageNumber currentPage={currentPage} totalPages={totalPages} isReflow={isReflow} />
          </Drawer>
        </div>
      )}
      <AppTourReader />
    </>
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

const useUpdateBookState = (bookId: string, progress: number | undefined, location: any | undefined) => {
  const [editBook] = useUpdateBook()
  const book = useRecoilValue(normalizedBooksState)[bookId || '-1']
  const readingStateCurrentBookmarkLocation = book?.readingStateCurrentBookmarkLocation

  useDebounce(() => {
    console.log(readingStateCurrentBookmarkLocation)
    if (location && location?.start?.cfi !== readingStateCurrentBookmarkLocation) {
      editBook({
        _id: bookId,
        readingStateCurrentBookmarkLocation: location?.start?.cfi,
        readingStateCurrentState: ReadingStateState.Reading,
        ...progress && {
          // progress
          readingStateCurrentBookmarkProgressPercent: progress,
        }
      })
    }
  }, 400, [progress, location, readingStateCurrentBookmarkLocation] as any)
}