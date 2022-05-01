import { Manifest } from "@prose-reader/core"
import { useCallback, useEffect, useState } from "react"
import { getBookFile } from "../download/getBookFile.shared"
import { Report } from "../debug/report.shared"
import { getArchiveForRarFile } from "./streamer/getArchiveForFile.shared"
import "../archive"
import { getManifestFromArchive } from "@prose-reader/streamer"
import { directives } from "@oboku/shared"
import { STREAMER_URL_PREFIX } from "../constants.shared"

const useGetRarManifest = () =>
  useCallback(async (bookId: string) => {
    const file = await getBookFile(bookId)
    const normalizedName = file?.name.toLowerCase()
    if (file && normalizedName?.endsWith(`.cbr`)) {
      const archive = await getArchiveForRarFile(file)

      return getManifestFromArchive(archive, {
        baseUrl: `/${STREAMER_URL_PREFIX}/rar`
      })
    }

    return undefined
  }, [])

export const useManifest = (bookId: string | undefined) => {
  const [manifest, setManifest] = useState<Manifest | undefined>(undefined)
  const [isRarFile, setIsRarFile] = useState(false)
  const [error, setError] = useState<
    { code: `unknown` | `fileNotSupported` } | undefined
  >(undefined)
  const getRarManifest = useGetRarManifest()

  useEffect(() => {
    setManifest(undefined)
    setError(undefined)
    setIsRarFile(false)
  }, [bookId])

  useEffect(() => {
    ;(async () => {
      if (bookId) {
        try {
          const response = await fetch(
            `${window.location.origin}/streamer/${bookId}/manifest`
          )

          if (response.status === 415) {
            // try to get manifest if it's a RAR
            const rarResponse = await getRarManifest(bookId)
            if (rarResponse) {
              setIsRarFile(true)
              const data = await rarResponse.json()
              const newManifest = getNormalizedManifest(data)

              Report.log(`manifest`, data)

              setManifest(newManifest)
            } else {
              setError({ code: `fileNotSupported` })
            }
          } else {
            const data: Manifest = await response.json()
            const newManifest = getNormalizedManifest(data)

            Report.log(`manifest`, data)

            setManifest(newManifest)
          }
        } catch (e) {
          Report.error(e)
          setError({ code: `unknown` })
        }
      }
    })()
  }, [bookId, getRarManifest])

  return { manifest, error, isRarFile }
}

const getNormalizedManifest = (data: Manifest): Manifest => {
  const { direction } = directives.extractDirectivesFromName(data.filename)

  return {
    ...data,
    readingDirection: direction
      ? direction
      : data.filename.endsWith(`.cbz`)
      ? "rtl"
      : data.readingDirection
  }
}
