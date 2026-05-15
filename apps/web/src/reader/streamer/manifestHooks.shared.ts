import { directives } from "@oboku/shared"
import type {
  Archive,
  Manifest,
  StreamerManifestHookFactory,
} from "@prose-reader/streamer"

type SpineItem = Manifest["spineItems"][number]

const isCbzArchive = (archive: Archive) =>
  archive.filename.toLowerCase().endsWith(".cbz")

const getReadingDirection = ({
  archive,
  manifest,
}: {
  archive: Archive
  manifest: Manifest
}): Manifest["readingDirection"] => {
  const { direction } = directives.extractDirectivesFromName(archive.filename)

  return (
    direction ?? (isCbzArchive(archive) ? "rtl" : manifest.readingDirection)
  )
}

const setWebtoonRenditionLayout = (spineItem: SpineItem): SpineItem => ({
  ...spineItem,
  renditionLayout: "reflowable",
})

export const readingDirectionManifestHook: StreamerManifestHookFactory =
  ({ archive }) =>
  (manifest) => {
    const readingDirection = getReadingDirection({ archive, manifest })

    if (readingDirection === manifest.readingDirection) {
      return manifest
    }

    return {
      ...manifest,
      readingDirection,
    }
  }

export const webtoonManifestHook: StreamerManifestHookFactory =
  ({ archive }) =>
  (manifest) => {
    const { isWebtoon } = directives.extractDirectivesFromName(archive.filename)

    if (!isWebtoon) {
      return manifest
    }

    return {
      ...manifest,
      renditionLayout: "reflowable",
      renditionFlow: "scrolled-continuous",
      spineItems: manifest.spineItems.map(setWebtoonRenditionLayout),
    }
  }
