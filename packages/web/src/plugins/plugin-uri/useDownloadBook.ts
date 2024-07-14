import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { ObokuPlugin, extractIdFromResourceId } from "../plugin-front"
import { httpClient } from "../../http/httpClient"
import { from, map } from "rxjs"

export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = () => {
  return ({ link, onDownloadProgress }) => {
    const downloadLink = extractIdFromResourceId(
      UNIQUE_RESOURCE_IDENTIFIER,
      link.resourceId
    )
    const filename =
      downloadLink.substring(downloadLink.lastIndexOf("/") + 1) || "unknown"

    return from(
      httpClient.download<Blob>({
        responseType: "blob",
        url: downloadLink,
        onDownloadProgress: (event) => {
          onDownloadProgress(event.loaded / (event.total ?? 1))
        }
      })
    ).pipe(
      map((mediaResponse) => {
        return { data: mediaResponse.data, name: filename }
      })
    )
  }
}
