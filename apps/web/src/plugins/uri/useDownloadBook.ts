import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { type ObokuPlugin, extractIdFromResourceId } from "../types"
import { httpClient, isXMLHttpResponseError } from "../../http/httpClient"
import { catchError, from, map } from "rxjs"
import { createDialog } from "../../common/dialogs/createDialog"
import { CancelError } from "../../errors/errors.shared"

export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = () => {
  return ({ link, onDownloadProgress }) => {
    const downloadLink = extractIdFromResourceId(
      UNIQUE_RESOURCE_IDENTIFIER,
      link.resourceId,
    )
    const filename =
      downloadLink.substring(downloadLink.lastIndexOf("/") + 1) || "unknown"

    return from(
      httpClient.download<Blob>({
        responseType: "blob",
        mode: "cors",
        url: downloadLink,
        onDownloadProgress: (event) => {
          onDownloadProgress(event.loaded / (event.total ?? 1))
        },
      }),
    ).pipe(
      map((mediaResponse) => {
        return { data: mediaResponse.data, name: filename }
      }),
      catchError((error) => {
        if (
          isXMLHttpResponseError(error) &&
          error.status === 0 &&
          error.statusText === ``
        ) {
          createDialog({
            autoStart: true,
            title: "Unable to download",
            content:
              "Make sure the resource is configured to allow cross origin requests (CORS)",
          })

          throw new CancelError()
        }

        throw error
      }),
    )
  }
}
