import { extractIdFromResourceId } from "./lib/resources"
import type { ObokuPlugin } from "../types"
import { catchError, from, map, mergeMap, switchMap } from "rxjs"
import { useGoogleScripts } from "./lib/scripts"
import { httpClientWeb } from "../../http/httpClient.web"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import {
  isDriveResponseError,
  useDriveFilesGet,
} from "../../google/useDriveFilesGet"
import { useRequestFilesAccess } from "./lib/useRequestFilesAccess"

export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = ({
  requestPopup,
}) => {
  const { getGoogleScripts } = useGoogleScripts()
  const requestFilesAccess = useRequestFilesAccess({
    requestPopup,
  })
  const getDriveFile = useDriveFilesGet()

  return ({ link, onDownloadProgress }) => {
    const fileId = extractIdFromResourceId(link.resourceId)

    return getGoogleScripts().pipe(
      switchMap(([, gapi]) => {
        return requestFilesAccess(gapi, [fileId]).pipe(
          switchMap(() =>
            getDriveFile(gapi, {
              fileId,
              fields: "name,size",
            }).pipe(
              mergeMap((info) => {
                return from(
                  httpClientWeb.download<Blob>({
                    /**
                     * @important
                     * The api key in the url does not appears to be needed since we have oauth.
                     * "X-Goog-Encode-Response-If-Executable" seems to be required otherwise we crash for some books.
                     */
                    // url: `/drive/v3/files/${fileId}?alt=media&key=AIzaSyBgTV-RQecG_TFwilsdUJXqKmeXEiNSWUg`,
                    url: `https://content.googleapis.com/drive/v3/files/${fileId}?alt=media&key=AIzaSyBgTV-RQecG_TFwilsdUJXqKmeXEiNSWUg`,
                    // url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                    headers: {
                      Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
                      // "X-Goog-Encode-Response-If-Executable": "base64"
                      // "x-javascript-user-agent":
                      //   "google-api-javascript-client/1.1.0",
                      // "x-origin": "http://localhost:5173",
                      // "x-referer": "http://localhost:5173",
                      // "x-requested-with": "XMLHttpRequest",
                      // Referer:
                      //   "https://content.googleapis.com/static/proxy.html?usegapi=1&jsh=m%3B%2F_%2Fscs%2Fabc-static%2F_%2Fjs%2Fk%3Dgapi.lb.en.pGGAptgAK4s.O%2Fam%3DAAAg%2Fd%3D1%2Frs%3DAHpOoo-Cic-4VdRMZ7mFCYOA3wzpF7O-6g%2Fm%3D__features__",
                      // "x-clientdetails":
                      //   "appVersion=5.0%20(X11%3B%20Linux%20x86_64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F127.0.0.0%20Safari%2F537.36&platform=Linux%20x86_64&userAgent=Mozilla%2F5.0%20(X11%3B%20Linux%20x86_64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F127.0.0.0%20Safari%2F537.36"
                    },
                    responseType: "blob",
                    onDownloadProgress: (event) => {
                      const totalSize = parseInt(info.result.size || "1") || 1
                      onDownloadProgress(event.loaded / totalSize)
                    },
                  }),
                ).pipe(
                  map((mediaResponse) => ({
                    data: mediaResponse.data,
                    name: info.result.name || "",
                  })),
                )
              }),
            ),
          ),
          catchError((e) => {
            if (isDriveResponseError(e)) {
              if (e.status === 404) {
                throw new ObokuSharedError(
                  ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND,
                  e,
                  "user",
                )
              }
            }

            throw e
          }),
        )
      }),
    )
  }
}
