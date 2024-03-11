import { CollectionDocType, directives } from "@oboku/shared"
import { fetchMetadata } from "./fetchMetadata"

export const refreshMetadata = async (
  collection: CollectionDocType,
  {
    googleApiKey
  }: {
    googleApiKey?: string
  }
) => {
  const title = collection.metadata?.find(
    (entry) => entry.type === "link"
  )?.title

  const titleWithoutDirective = directives.removeDirectiveFromString(
    title ?? ""
  )

  const metadata = await fetchMetadata(
    { title: titleWithoutDirective },
    { withGoogle: true, googleApiKey }
  )

  console.log(metadata)
}
