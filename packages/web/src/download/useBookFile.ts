import { useEffect, useState } from "react"
import { getBookFile } from "./getBookFile.shared"
import { BookFile } from "./types"

export const useBookFile = (bookId: string) => {
  const [file, setFile] = useState<BookFile | null | undefined>(undefined)

  useEffect(() => {
    let terminated = false

    ;(async () => {
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
