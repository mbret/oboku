import { useEffect, useState } from "react"
import { BookFile } from "./types"
import localforage from 'localforage';
import { DOWNLOAD_PREFIX } from "../constants";

export const useBookFile = (bookId: string) => {
  const [file, setFile] = useState<BookFile | null | undefined>(undefined)

  useEffect(() => {
    let terminated = false

      ; (async () => {
        const item = await getBookFile(bookId)

        if (!terminated) {
          setFile(item)
        }
      })()

    return () => {
      terminated = true
    }
  }, [bookId])

  return file
}

export const getBookFile = (bookId: string) => {
  console.warn(`${DOWNLOAD_PREFIX}-${bookId}`)
  
  return localforage.getItem<BookFile>(`${DOWNLOAD_PREFIX}-${bookId}`)
}