import React, { useState, useEffect, useRef, ComponentProps, useCallback } from 'react'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import localforage from 'localforage';
import { ReactReader, EpubView } from "react-reader";
import { createBreakpoint, useWindowSize } from "react-use";
import { useMutation, useQuery } from '@apollo/client';
import { Divider, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { ArrowBackIosRounded } from '@material-ui/icons';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import { Rendition } from "epubjs";
import { Contents } from "epubjs";
import { EDIT_BOOK, GET_BOOK } from './books/queries';

type ReaderInstance = {
  nextPage: () => void,
  prevPage: () => void,
}

export const Reader = (props) => {
  const readerRef = useRef<ReaderInstance>()
  const rootRef = useRef<HTMLDivElement>()
  const history = useHistory()
  const [rendition, setRendition] = useState<Rendition | undefined>(undefined)
  const { bookId } = useParams()
  const file = useFile(bookId)
  const [isTopMenuShown, setIsTopMenuShown] = useState(false)
  const [isBottomMenuShown, setIsBottomMenuShown] = useState(false)
  const { data: bookData } = useQuery(GET_BOOK, { variables: { id: bookId } })
  const windowSize = useWindowSize()
  const [editBook, data] = useMutation(EDIT_BOOK, {

  })
  const book = bookData?.book

  console.log(book?.location, (data as any)?.editBook?.location)

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
    const { offsetX, offsetY } = e
    const maxOffsetPrev = windowSize.width / 6
    const maxOffsetBottomMenu = windowSize.height / 5
    const minOffsetNext = windowSize.width - maxOffsetPrev
    const minOffsetBottomMenu = windowSize.height - maxOffsetBottomMenu
    if (offsetX < maxOffsetPrev) {
      prev()
    } else if (offsetX > minOffsetNext) {
      next()
    }
    else if (offsetY < maxOffsetBottomMenu) {
      setIsTopMenuShown(true)
    } else if (offsetY > minOffsetBottomMenu) {
      setIsBottomMenuShown(true)
    }
  }, [windowSize, next, prev])

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

  useVerticalCentererRendererHook(rendition)

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
              location={book.location}
              locationChanged={epubcifi => {
                console.log('mutate')
                editBook({
                  variables: {
                    id: bookId,
                    location: epubcifi
                  }
                }).catch(() => { })
              }}
            />
          )}
          <Drawer
            anchor="top"
            open={isTopMenuShown}
            onClose={() => setIsTopMenuShown(false)}
            transitionDuration={0}
          >
            <div
              role="presentation"
            // onClick={toggleDrawer(anchor, false)}
            // onKeyDown={toggleDrawer(anchor, false)}
            >
              <List>
                <ListItem
                  button
                  onClick={() => {
                    history.goBack()
                  }}
                >
                  <ListItemIcon><ArrowBackIosRounded /></ListItemIcon>
                  <ListItemText primary="Leave the reader" />
                </ListItem>
              </List>
            </div>
          </Drawer>
          <Drawer
            anchor="bottom"
            open={isBottomMenuShown}
            onClose={() => setIsBottomMenuShown(false)}
            transitionDuration={0}
          >
            <div
              role="presentation"
            >
              <List>
                {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
                  <ListItem button key={text}>
                    <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                    <ListItemText primary={text} />
                  </ListItem>
                ))}
              </List>
              <Divider />
              <List>
                {['All mail', 'Trash', 'Spam'].map((text, index) => (
                  <ListItem button key={text}>
                    <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                    <ListItemText primary={text} />
                  </ListItem>
                ))}
              </List>
            </div>
          </Drawer>
        </div>
      )}
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