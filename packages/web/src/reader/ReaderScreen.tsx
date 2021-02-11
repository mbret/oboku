/**
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js#L407-L469
 */
import React, { useState, useEffect, useRef, useCallback, FC, useMemo } from 'react'
import { useHistory, useParams } from 'react-router-dom'

import { EpubView } from './EpubView'
import { useWindowSize } from "react-use";
import { Box, Button, Link, Typography } from '@material-ui/core';
import { Rendition, Contents, Location } from "epubjs";
import { useUpdateBook } from '../books/helpers';
import { AppTourReader } from '../firstTimeExperience/AppTourReader';
import { useHorizontalTappingZoneWidth } from './utils';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { bookState } from '../books/states';
import { currentApproximateProgressState, currentChapterState, currentDirectionState, currentLocationState, currentPageState, isMenuShownState, layoutState, tocState, totalApproximativePagesState } from './states';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { useGenerateLocations, useResetStateOnUnmount, useUpdateBookState, useFile } from './helpers';
import { ReaderProvider } from './ReaderProvider';
import { ComicReader } from './comic/ComicReader';
import { clone } from 'ramda';
import screenfull, { Screenfull } from 'screenfull'
import { Report } from '../report';
import { IS_MOBILE_DEVICE } from '../constants';
import { localSettingsState } from '../settings/states';
import { PackagingMetadataObjectWithMissingProperties } from './types';
import { BookLoading } from './BookLoading';
import { extractMetadataFromName } from '@oboku/shared/dist/directives';

const screenfullApi = screenfull as Screenfull

export const ReaderScreen: FC<{}> = () => {
  const readerRef = useRef<any>()
  const rootRef = useRef<HTMLDivElement>()
  const [isBookReady, setIsBookReady] = useState(false)
  const setCurrentApproximateProgress = useSetRecoilState(currentApproximateProgressState)
  const [rendition, setRendition] = useState<Rendition | undefined>(undefined)
  const { bookId } = useParams<{ bookId?: string }>()
  const { file, documentType, error: fileError, filename } = useFile(bookId || '-1')
  const book = useRecoilValue(bookState(bookId || '-1'))
  const windowSize = useWindowSize()
  const [editBook] = useUpdateBook()
  const horizontalTappingZoneWidth = useHorizontalTappingZoneWidth()
  const setIsMenuShown = useSetRecoilState(isMenuShownState)
  const [layout, setLayout] = useRecoilState(layoutState)
  const setCurrentPage = useSetRecoilState(currentPageState)
  const setTotalApproximativePages = useSetRecoilState(totalApproximativePagesState)
  const setToc = useSetRecoilState(tocState)
  const [currentLocation, setCurrentLocation] = useRecoilState(currentLocationState)
  const setCurrentChapter = useSetRecoilState(currentChapterState)
  const firstLocation = useRef(book?.readingStateCurrentBookmarkLocation || undefined)
  const history = useHistory()
  const localSettings = useRecoilValue(localSettingsState)
  const direction = useRecoilValue(currentDirectionState)

  useGenerateLocations(rendition)
  useResetStateOnUnmount()

  // @todo only show menu on short click
  const onRenditionClick = useCallback((e: MouseEvent) => {
    const { clientX } = e

    // let wrapper = rendition?.manager?.container;

    // let realClientXOffset = clientX - (windowSize.width * pageDisplayedIndex)
    let realClientXOffset = clientX

    const iframeBoundingClientRect = e.view?.frameElement?.getBoundingClientRect()

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
      if (direction === 'ltr') rendition?.prev()
      else rendition?.next()
    } else if (realClientXOffset > minOffsetNext) {
      if (direction === 'ltr') rendition?.next()
      else rendition?.prev()
    } else {
      setIsMenuShown(val => !val)
    }

    // else if (clientY < maxOffsetBottomMenu) {
    //   setIsTopMenuShown(true)
    // } else if (clientY > minOffsetBottomMenu) {
    //   setIsBottomMenuShown(true)
    // }
  }, [windowSize, horizontalTappingZoneWidth, rendition, setIsMenuShown, documentType, direction])

  useEffect(() => {
    if (
      (
        localSettings.readingFullScreenSwitchMode === 'always'
        || (localSettings.readingFullScreenSwitchMode === 'automatic' && IS_MOBILE_DEVICE)
      )
      && screenfullApi.isEnabled && !screenfullApi.isFullscreen) {
      screenfullApi.request(undefined, { navigationUI: 'hide' }).catch(Report.error)
    }

    return () => {
      if (screenfullApi.isEnabled && screenfullApi.isFullscreen) {
        screenfullApi.exit().catch(Report.error)
      }
    }
  }, [localSettings])

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

  const updateProgress = useCallback((currentLocation: Location) => {
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
      // type is wrong here, the return is a number (-1, 120, 1, etc)
      // but in case the api change we will treat it as any and type check
      const startLocation = rendition?.book.locations.locationFromCfi(currentLocation.start.cfi) as unknown

      const _currentPage = currentLocation.start.displayed.page
      // currentLocation?.atEnd
      //   ? currentLocation?.end?.location
      //   : currentLocation?.start?.displayed.page

      console.log('updateProgress', currentLocation, layout, _currentPage)

      if (currentLocation && (_currentPage > -1)) {
        const progress: number | undefined | null =
          // when location is -1, it means the book has not finished generating. This means we cannot have a 
          // valid percentageFromCfi. In fact percentageFromCfi will return 1, which is wrong
          (typeof startLocation === 'number') && startLocation === -1
            ? undefined
            : rendition?.book.locations.percentageFromCfi(currentLocation?.start?.cfi);
        rendition?.book.locations.locationFromCfi(currentLocation?.start?.cfi)
        if (typeof progress === 'number') {
          const finalProgress = currentLocation?.atEnd ? 1 : progress
          // The % of how far along in the book you are
          setCurrentApproximateProgress(finalProgress)
          setCurrentPage(_currentPage)
          setTotalApproximativePages((rendition?.book.locations as any)?.total)
        } else {
          // this is a fallback when the locations have not been loaded successfully.
          // it can happens whenever there is a "fixed" book that does not have the meta
          // It will be like a reflow with X chapters which are X pages which contains one image
          setCurrentPage(currentLocation?.start.index)
          setTotalApproximativePages(rendition?.book.packaging.spine.length)
        }
      }
    }
  }, [rendition, layout, setCurrentPage, setTotalApproximativePages, setCurrentApproximateProgress])

  useEffect(() => {

    const onRelocated = async (location: Location) => {
      setIsBookReady(true)
      const newLocation = await rendition?.currentLocation() as any
      setCurrentLocation(clone(newLocation))
      updateProgress(location)
    }

    rendition?.on('relocated', onRelocated);

    return () => rendition?.off('relocated', onRelocated)
  }, [rendition, editBook, bookId, book, updateProgress, setCurrentLocation])

  useUpdateBookState(bookId || '-1')
  useDirection(rendition)

  const { direction: metadataDirection } = (filename ? extractMetadataFromName(filename) : undefined || {})

  const epubOptions = useMemo(() => ({
    // spread: 'never' // never / always
    minSpreadWidth: 99999,
    // defaultDirection: 'ltr',
    ...metadataDirection && {
      defaultDirection: metadataDirection
    }
    // stylesheet: 'html { display: none; } ',
  }), [metadataDirection])

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
          {
            /**
             * This div is used to capture click event in case where epubjs does not cover the
             * entire screen with its iframe. It does happens for example when a fixed layout is on spread 
             * mode but there is only one page. There will be one half of the screen empty and therefore
             * no rendition.on.click event.
             */
          }
          <div
            style={{
              height: windowSize.height,
              width: windowSize.width,
              position: "relative",
            }}
            onClick={e => onRenditionClick(e.nativeEvent)}
          >
            {documentType === 'epub' && (
              <>
                <EpubView
                  // http://epubjs.org/documentation/0.3/#bookrenderto
                  ref={readerRef as any}
                  // Bug in typing, epubjs accept blobs
                  url={file as any}
                  getRendition={setRendition}
                  epubOptions={epubOptions}
                  location={firstLocation.current}
                />
                {!isBookReady && (
                  <BookLoading />
                )}
              </>
            )}
            {(documentType === 'comic') && (
              <>
                <ComicReader
                  url={file}
                  getRendition={setRendition}
                  location={firstLocation.current}
                  epubOptions={epubOptions}
                />
                {!isBookReady && (
                  <BookLoading />
                )}
              </>
            )}
            {documentType === 'unknown' && (
              <Box display="flex" alignItems="center" textAlign="center" p={2} height="100%">
                <Typography>
                  Oups! it looks like the book <b>{book?.title}</b> is not supported yet.
                  If you would like to be able to open it please visit the <Link href="https://docs.oboku.me" target="__blank">documentation</Link> and try to reach out.
                </Typography>
              </Box>
            )}
          </div>
          <TopBar />
          <BottomBar />
        </div>
      )
      }
      <AppTourReader />
    </ReaderProvider >
  )
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

const useDirection = (rendition?: Rendition) => {
  const setCurrentDirectionState = useSetRecoilState(currentDirectionState)
  const { direction } = rendition?.book.packaging.metadata as PackagingMetadataObjectWithMissingProperties | undefined || {}

  useEffect(() => {
    if (direction === 'rtl') {
      setCurrentDirectionState('rtl')
    } else {
      setCurrentDirectionState('ltr')
    }
  }, [direction, setCurrentDirectionState])
}