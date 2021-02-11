import React, { createContext, FC, useContext, useMemo } from "react";
import { Rendition } from "epubjs"

type Reader = {
  turnPageRight: () => void,
  turnPageLeft: () => void,
  goToPageByBookPercentage: (value: number) => void,
  goToPage: (value: number) => void,
}

const ReaderContext = createContext<Reader | undefined>(undefined)

export const ReaderProvider: FC<{ rendition: Rendition | undefined }> = ({ rendition, children }) => {

  const reader: Reader = useMemo(() => ({
    turnPageRight: () => {
      rendition?.next()
    },
    turnPageLeft: () => {
      rendition?.prev()
    },
    goToPageByBookPercentage: (value: number) => {
      const cfi = rendition?.book.locations.cfiFromPercentage(value)
      if (cfi) {
        rendition?.display(cfi)
      }
    },
    goToPage: (value: number) => {
      const section = rendition?.book?.spine?.get(value)
      if (section) {
        rendition?.display(section?.href)
      }
    }
  }), [rendition])

  return (
    <ReaderContext.Provider value={reader}>
      {children}
    </ReaderContext.Provider>
  )
}

export const useReader = () => useContext(ReaderContext)