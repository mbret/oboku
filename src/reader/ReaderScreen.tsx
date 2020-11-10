import React, { useState, useEffect, useRef, useCallback, FC } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import localforage from 'localforage';
import { EpubView } from "react-reader";
import { useWindowSize } from "react-use";
import { Divider, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar } from '@material-ui/core';
import { ArrowBackIosRounded } from '@material-ui/icons';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import { Rendition } from "epubjs";
import { Contents, Location } from "epubjs";
import { useEditBook, useBook } from '../books/queries';
import { AppTourReader } from '../firstTimeExperience/AppTourReader';
import { useHorizontalTappingZoneWidth, useVerticalTappingZoneHeight } from './utils';

type ReaderInstance = {
  nextPage: () => void,
  prevPage: () => void,
}

export const ReaderScreen: FC<{}> = () => {
  const readerRef = useRef<ReaderInstance>()
  const rootRef = useRef<HTMLDivElement>()
  const history = useHistory()
  const [rendition, setRendition] = useState<Rendition | undefined>(undefined)
  const { bookId } = useParams<any>()
  const file = useFile(bookId)
  const [isTopMenuShown, setIsTopMenuShown] = useState(false)
  const [isBottomMenuShown, setIsBottomMenuShown] = useState(false)
  const { data: bookData } = useBook({ variables: { id: bookId } })
  const windowSize = useWindowSize()
  const editBook = useEditBook()
  const verticalTappingZoneHeight = useVerticalTappingZoneHeight()
  const horizontalTappingZoneWidth = useHorizontalTappingZoneWidth()
  const book = bookData?.book

  console.log('[ReaderScreen]', bookData)

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
    // console.log(e)
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


  useEffect(() => {
    // rendition?.book.ready.then(function () {
    //   // const stored = localStorage.getItem(rendition?.book.key() + '-locations');
    //   console.log('metadata:', (rendition?.book as any)?.package);
    //   // if (stored) {
    //   // return rendition?.book.locations.load(stored);
    //   // } else {
    //   return rendition?.book.locations.generate(1024); // Generates CFI for every X characters (Characters per/page)
    //   // }
    // }).then(function (location: any) { // This promise will take a little while to return (About 20 seconds or so for Moby Dick)
    //   // localStorage.setItem(rendition?.book.key() + '-locations', rendition?.book.locations.save());
    //   console.log(rendition?.book.key(), location, location.findIndex(v => v === rendition?.book.key()))
    // });

    const onRelocated = async (location: Location) => {
      const currentStartIndex = location?.start.index
      let progress: number | undefined

      /**
       * Comic detected
       * For comic the rendering does not work and will always return page number of 0
       * and a location of -1. We just get the number of pages based on spine and the current index.
       * If the book is fully pre-paginated the number of pages should not change anyway.
       */
      if (rendition?.book.packaging.metadata.layout === 'pre-paginated') {
        const pageNumber = location.start.index + 1
        progress = pageNumber / rendition?.book.packaging.spine.length
      }

      console.log(`onRelocated`,
        location,
        rendition?.book.packaging.metadata.layout,
        rendition?.book.packaging,
        await rendition?.book.getRange(location.start.cfi),
        rendition?.book.locations,
        progress,
      )
      //   // debugger
      //   console.log(`relocated`, location)
      // // @see https://github.com/futurepress/epub.js/issues/278. It needs to load all locations
      // const progress = rendition?.book.locations.percentageFromCfi(location.start.cfi);
      // const finalProgress = location.atEnd ? 1 : progress
      // console.log('Progress:', finalProgress); // The % of how far along in the book you are
      // console.log('Current Page:', rendition?.book.locations.locationFromCfi(location.start.cfi))
      // console.log('Total Pages:', (rendition?.book.locations as any).total);

      if (location.start.cfi !== book?.readingStateCurrentBookmarkLocation) {
        editBook({
          id: bookId,
          readingStateCurrentBookmarkLocation: location.start.cfi,
          readingStateCurrentBookmarkProgressPercent: progress,
        })
      }
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
  }, [rendition, editBook, bookId, book])

  console.log(rendition?.getContents(), rendition?.book)

  return (
    <>
      {!file && (
        <div>Loading...</div>
      )}
      {file && (
        <div
          style={{
            position: "relative",
            height: windowSize.height,
            width: windowSize.width,
          }}
          ref={rootRef as any}
        >
          {" "}
          {book && (
            <EpubView
              ref={readerRef as any}
              url={file}
              getRendition={setRendition}
              epubInitOptions={{

              }}
              // http://epubjs.org/documentation/0.3/#bookrenderto
              epubOptions={{
                // flow: 'paginated',
                // width: "100%",
                // height: "100%",
                // stylesheet: `/reader.css`,
              }}
              // url={'/2.epub'}
              location={book.readingStateCurrentBookmarkLocation || undefined}
            // locationChanged={onLocationChanged}
            />
          )}
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
            Not implemented yet
          </Drawer>
        </div>
      )}
      <AppTourReader />
    </>
  )
}

const useFile = (bookId) => {
  const [file, setFile] = useState<ArrayBuffer | undefined>(undefined)

  useEffect(() => {
    (async () => {
      const data = await localforage.getItem<ArrayBuffer>(`book-download-${bookId}`)
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
        if (height < windowInnerHeight) {
          $body.style.paddingTop = `${(windowInnerHeight - height) / 2}px`
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