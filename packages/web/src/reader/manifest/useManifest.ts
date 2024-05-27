import { Manifest } from "@prose-reader/shared"
import { useManifestFromRar } from "./useManifestFromRar"
import { useManifestFromStreamer } from "./useManifestFromStreamer"
import { directives } from "@oboku/shared"
import { Report } from "../../debug/report.shared"
import { useEffect, useMemo } from "react"

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

export const useManifest = (bookId: string | undefined) => {
  const manifestFromStreamer = useManifestFromStreamer({
    bookId
  })

  const isInvalidType = manifestFromStreamer.data === null

  const manifestFromRarQuery = useManifestFromRar({
    bookId,
    enabled: isInvalidType
  })

  const manifest = manifestFromStreamer.data || manifestFromRarQuery.data
  const normalizedManifest = useMemo(
    () => manifest && getNormalizedManifest(manifest),
    [manifest]
  )

  useEffect(() => {
    if (normalizedManifest) {
      Report.log(`manifest`, normalizedManifest)
    }
  }, [normalizedManifest])

  if (isInvalidType)
    return {
      ...manifestFromRarQuery,
      isRarFile: !!normalizedManifest,
      data: normalizedManifest
    }

  return { ...manifestFromStreamer, isRarFile: false, data: normalizedManifest }
}
