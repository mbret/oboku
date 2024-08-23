import { generateResourceFromArchive } from "@prose-reader/streamer"
import { getResourcePathFromUrl } from "./getResourcePathFromUrl.shared"
import { useArchiveForRarFile } from "./useArchiveForRarFile"
import { createAppReader } from "../useCreateReader"

type FetchResource = Parameters<typeof createAppReader>[0]["fetchResource"]

export const useFetchResource = (bookId: string | undefined) => {
  const { data: archive, refetch } = useArchiveForRarFile({ bookId })

  const fetchResource: NonNullable<FetchResource> = async (item) => {
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
