import React from 'react'
import { useState } from 'react';
import { useEffect } from "react"
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { createGestureHandler } from "./gesture";
import { createReader } from "../reader";
import { QuickMenu } from './QuickMenu';
import { bookReadyState, isComicState, manifestState, paginationState } from './state';

export const Reader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [reader, setReader] = useState<ReturnType<typeof createReader> | undefined>(undefined)
  const [gestureHandler, setGestureHandler$] = useState<ReturnType<typeof createGestureHandler> | undefined>(undefined)
  const [manifest, setManifestState] = useRecoilState(manifestState)
  const isComic = useRecoilValue(isComicState)
  const setPaginationState = useSetRecoilState(paginationState)
  const [bookReady, setBookReady] = useRecoilState(bookReadyState)

  // @ts-ignore
  window.reader = reader

  useEffect(() => {
    const subscription = gestureHandler?.$?.subscribe(({ event }) => {
      if (event === 'tap') {
        setIsMenuOpen(!isMenuOpen)
      }
    })

    return () => subscription?.unsubscribe()
  }, [gestureHandler, isMenuOpen])

  useEffect(() => {
    window.addEventListener(`resize`, () => {
      reader?.layout()
    })

    const readerSubscription$ = reader?.$.subscribe((data) => {
      // console.log(data)
      if (data.event === 'ready') {
        setBookReady(true)
      }
      if (data.event === 'paginationChange') {
        localStorage.setItem(`cfi`, reader.getPagination()?.begin.cfi || ``)
        return setPaginationState(reader.getPagination())
      }
    })

    return () => readerSubscription$?.unsubscribe()
  }, [reader, gestureHandler, setBookReady, setPaginationState])

  useEffect(() => {
    if (!reader) return

    (async () => {
      try {
        const bookManifest = await fetchManifest()

        setManifestState(bookManifest)

        console.warn('MANIFEST', {bookManifest, cfi: localStorage.getItem(`cfi`)})
        reader.load(bookManifest, {
          fetchResource: 'http'
        }, localStorage.getItem(`cfi`) || 0)
        // reader.load(bookManifest, `epubcfi(/0[oboku:id-id2629773])`)
        // reader.load(bookManifest, 3)
        // reader.load(bookManifest, `epubcfi(/2/4[oboku:Vol.04 Ch.0022.1 (gb) [Sense Scans]/004.jpg])`)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [setManifestState, reader])

  useEffect(() => {
    return () => reader?.destroy()
  }, [reader])

  return (
    <>
      <div ref={ref => {
        if (ref && !gestureHandler && reader) {
          setGestureHandler$(createGestureHandler(ref, reader))
        }
      }}>
        <>
          <div id="container" ref={ref => {
            if (ref && !reader) {
              const reader = createReader({ containerElement: ref })
              setReader(reader)
            }
          }} />
          {!bookReady && (
            <div
              style={{
                height: '100%',
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            ><h5>Loading book</h5></div>
          )}
        </>
      </div>
      <QuickMenu
        open={isMenuOpen}
        onReadingItemChange={index => {
          reader?.goTo(index)
        }}
        onPageChange={pageIndex => {
          if (isComic) {
            reader?.goTo(pageIndex)
          } else {
            reader?.goToPageOfCurrentChapter(pageIndex)
          }
        }} />
    </>
  )
}

const fetchManifest = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const epubPath = urlParams.get(`epub`);

  const response = await fetch(`http://localhost:9000/reader/${epubPath}/manifest`)
  const bookManifest = await response.json()

  console.log(bookManifest)

  return bookManifest
}

const useGestures = () => {

}