import { generateResourceFromArchive } from "@prose-reader/streamer"
import { ReactReaderProps } from "../states"
import { getResourcePathFromUrl } from "./getResourcePathFromUrl.shared"
import { useArchiveForRarFile } from "./useArchiveForRarFile"

export const useFetchResource = (bookId: string | undefined) => {
  const { data: archive, refetch } = useArchiveForRarFile({ bookId })

  const fetchResource: NonNullable<
    NonNullable<ReactReaderProps["options"]>["fetchResource"]
  > = async (item) => {
    const existingArchive =
      archive ?? (await refetch({ throwOnError: true })).data

    if (!existingArchive) {
      return new Response(``, { status: 500 })
    }

    const resourcePath = getResourcePathFromUrl(item.href)

    const resource = await generateResourceFromArchive(
      existingArchive,
      resourcePath
    )

    return new Response(resource.body, { ...resource.params, status: 200 })
  }

  return { fetchResource: archive ? fetchResource : undefined }
}
