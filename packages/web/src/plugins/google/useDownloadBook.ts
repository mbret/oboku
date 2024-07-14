import { extractIdFromResourceId } from "./lib/resources"
import { isDriveResponseError } from "./lib/types"
import { useAccessToken } from "./lib/useAccessToken"
import { ObokuPlugin } from "../plugin-front"
import { httpClient } from "../../http/httpClient"
import { catchError, filter, from, mergeMap, of } from "rxjs"
import { gapiOrThrow$ } from "./lib/gapi"

export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = ({
  requestPopup
}) => {
  const { requestToken } = useAccessToken({ requestPopup })

  const downloadBook = ({ link, onDownloadProgress }) => {
    return requestToken({
      scope: ["https://www.googleapis.com/auth/drive.readonly"]
    }).pipe(
      mergeMap(() => {
        return gapiOrThrow$.pipe(
          filter((value) => !!value),
          mergeMap((gapi) => {
            const fileId = extractIdFromResourceId(link.resourceId)

            return from(
              gapi.client.drive.files.get({
                fileId,
                fields: "name,size"
              })
            ).pipe(
              mergeMap((info) => {
                return from(
                  httpClient.download<Blob>({
                    url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                    headers: {
                      Authorization: `Bearer ${gapi.auth.getToken().access_token}`
                    },
                    responseType: "blob",
                    onDownloadProgress: (event) => {
                      const totalSize = parseInt(info.result.size || "1") || 1
                      onDownloadProgress(event.loaded / totalSize)
                    }
                  })
                ).pipe(
                  mergeMap((mediaResponse) => {
                    return of({
                      data: mediaResponse.data,
                      name: info.result.name || ""
                    })
                  })
                )
              }),
              catchError((e) => {
                if (isDriveResponseError(e)) {
                  if (e.status === 404) {
                    return of({
                      isError: true,
                      reason: `notFound`,
                      error: e
                    } as const)
                  }
                }

                throw e
              })
            )
          })
        )
      })
    )
  }

  return downloadBook
}
