import { directives } from "@oboku/shared"
import type { Archive, Manifest } from "@prose-reader/streamer"

export const onManifestSuccess = async ({
  manifest,
  archive,
}: {
  archive: Archive
  manifest: Manifest
}): Promise<Manifest> => {
  const { isWebtoon, direction } = directives.extractDirectivesFromName(
    archive.filename,
  )

  const readingDirection = direction
    ? direction
    : archive.filename.endsWith(".cbz")
      ? "rtl"
      : manifest.readingDirection

  if (isWebtoon) {
    return {
      ...manifest,
      readingDirection,
      renditionLayout: "reflowable",
      renditionFlow: "scrolled-continuous",
      spineItems: manifest.spineItems.map((item) => ({
        ...item,
        renditionLayout: "reflowable" as const,
      })),
    }
  }

  return {
    ...manifest,
    readingDirection,
  }
}
