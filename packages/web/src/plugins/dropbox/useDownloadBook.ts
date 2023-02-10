import { Dropbox, DropboxResponse, files } from "dropbox"
import { useCallback } from "react"
import { ObokuPlugin } from "@oboku/plugin-front"
import { authUser } from "./lib/auth"
import { extractIdFromResourceId } from "./helpers"

// this property is somehow missing. must be a bug in dropbox
// @see https://github.com/dropbox/dropbox-sdk-js/issues/304
type ResponseWithFileBlob = DropboxResponse<files.FileMetadata> & {
  result?: {
    fileBlob?: Blob
  }
}

export const useDownloadBook: ObokuPlugin[`useDownloadBook`] = ({
  requestPopup
}) => {
  return useCallback(async (link) => {
    const auth = await authUser({ requestPopup })

    let dropbox = new Dropbox({ auth })

    const response: ResponseWithFileBlob = await dropbox.filesDownload({
      path: extractIdFromResourceId(link.resourceId)
    })

    if (!response.result.fileBlob) {
      throw new Error("missing file blob")
    }

    return { data: response.result.fileBlob, name: response.result.name }
  }, [requestPopup])
}
