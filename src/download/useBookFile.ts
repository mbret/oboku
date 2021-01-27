import { useEffect, useState } from "react"
import { BookFile } from "./types"
import localforage from 'localforage';
import { DOWNLOAD_PREFIX } from "../constants";

export const useBookFile = (bookId: string) => {
  const [file, setFile] = useState<BookFile | null | undefined>(undefined)

  useEffect(() => {
    let terminated = false
    
      ; (async () => {
        const item = await localforage.getItem<BookFile>(`${DOWNLOAD_PREFIX}-${bookId}`)

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