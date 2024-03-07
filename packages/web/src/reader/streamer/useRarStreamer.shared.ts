import { generateResourceFromArchive } from "@prose-reader/streamer"
import { useEffect } from "react"
import { useCallback, useState } from "react"
import { getBookFile } from "../../download/getBookFile.shared"
import { PromiseReturnType } from "../../types"
import { getArchiveForRarFile } from "./getArchiveForFile.shared"
import { ReactReaderProps } from "../states"
import { getResourcePathFromUrl } from "./getResourcePathFromUrl.shared"

export const useRarStreamer = (bookId: string | undefined) => {
  const [archive, setArchive] = useState<
    PromiseReturnType<typeof getArchiveForRarFile> | undefined
  >()

  useEffect(() => {
    let cancelled = false

    if (!bookId) {
      setArchive(undefined)
    }

    ;(async () => {
      if (bookId) {
        const file = await getBookFile(bookId)
        if (file) {
          const archive = await getArchiveForRarFile(file)
          if (!cancelled) {
            setArchive(archive)
          }
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [bookId])

  useEffect(
    () => () => {
      setArchive(undefined)
    },
    []
  )

  // @todo make it cancellable
  const fetchResource: NonNullable<
    NonNullable<ReactReaderProps["loadOptions"]>["fetchResource"]
  > = useCallback(
    async (item) => {
      if (archive) {
        const resourcePath = getResourcePathFromUrl(item.href)

        const resource = await generateResourceFromArchive(
          archive,
          resourcePath
        )

        return new Response(resource.body, { ...resource.params, status: 200 })
      }
      return new Response(``, { status: 404 })
    },
    [archive]
  )

  return { fetchResource: archive ? fetchResource : undefined }
}
