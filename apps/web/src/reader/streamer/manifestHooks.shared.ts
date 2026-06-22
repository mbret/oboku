import { directives } from "@oboku/shared"
import type {
  Manifest,
  StreamerManifestHookFactory,
} from "@prose-reader/streamer"

type SpineItem = Manifest["spineItems"][number]

const setWebtoonRenditionLayout = (spineItem: SpineItem): SpineItem => ({
  ...spineItem,
  renditionLayout: "reflowable",
})

export const readingDirectionManifestHook: StreamerManifestHookFactory =
  ({ archive }) =>
  (manifest) => {
    const { direction } = directives.extractDirectivesFromName(
      archive.filename ?? "",
    )

    if (direction === undefined) return manifest
    if (direction === manifest.readingDirection) return manifest

    return {
      ...manifest,
      readingDirection: direction,
    }
  }

export const webtoonManifestHook: StreamerManifestHookFactory =
  ({ archive }) =>
  (manifest) => {
    const { isWebtoon } = directives.extractDirectivesFromName(
      archive.filename ?? "",
    )

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
