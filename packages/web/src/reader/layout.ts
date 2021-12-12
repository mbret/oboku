import { useEffect } from "react"
import { Reader } from "@prose-reader/core"

export const useBookResize = (reader: Reader | undefined, containerWidth: number, containerHeight: number) => {
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (reader) {
      timeout = setTimeout(() => {
        reader.layout()
      }, 100)
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [reader, containerWidth, containerHeight])
}
