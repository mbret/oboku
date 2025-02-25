import { Dropbox, type DropboxResponse, type files } from "dropbox"
import { authUser } from "./lib/auth"
import { extractIdFromResourceId } from "./helpers"
import type { ObokuPlugin } from "../types"
import { from, map, mergeMap } from "rxjs"

// this property is somehow missing. must be a bug in dropbox
// @see https://github.com/dropbox/dropbox-sdk-js/issues/304
type ResponseWithFileBlob = DropboxResponse<files.FileMetadata> & {
  result?: {
    fileBlob?: Blob
  }
}

export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = ({
  requestPopup,
}) => {
  return ({ link }) => {
    return from(authUser({ requestPopup })).pipe(
      mergeMap((auth) => {
        const dropbox = new Dropbox({ auth })

        return from(
          dropbox.filesDownload({
            path: extractIdFromResourceId(link.resourceId),
          }),
        ).pipe(
          map((response: ResponseWithFileBlob) => {
            if (!response.result.fileBlob) {
              throw new Error("missing file blob")
            }

            return {
              data: response.result.fileBlob,
              name: response.result.name,
            }
          }),
        )
      }),
    )
  }
}
