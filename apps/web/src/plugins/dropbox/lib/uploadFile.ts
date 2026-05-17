import { httpClientWeb } from "../../../http/httpClient.web"
import { toProgressRatioHandler } from "../../../http/toProgressRatioHandler"

const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload"

/**
 * Dropbox requires `Dropbox-API-Arg` header bytes to be ASCII even
 * though the value is JSON, so any non-ASCII code point has to be
 * re-encoded as a `\uXXXX` JSON escape. Surrogate pairs round-trip
 * correctly because each unit is escaped independently.
 *
 * Mirrors the `httpHeaderSafeJson` helper in `dropbox-sdk-js`
 * (`node_modules/dropbox/src/utils.js`); we duplicate it because
 * the SDK doesn't re-export it from its public entry. Source:
 * https://www.dropboxforum.com/t5/API-support/HTTP-header-quot-Dropbox-API-Arg-quot-could-not-decode-input-as/m-p/173823/#M6786
 */
const toAsciiSafeJson = (value: object) =>
  JSON.stringify(value).replace(/[\u007f-\uffff]/g, (char) => {
    const hex = char.charCodeAt(0).toString(16).padStart(4, "0")

    return `\\u${hex}`
  })

type Params = {
  accessToken: string
  path: string
  file: Blob | File
  onProgress?: (progress: number) => void
}

export const uploadFile = ({ accessToken, path, file, onProgress }: Params) =>
  httpClientWeb.upload$({
    url: DROPBOX_UPLOAD_URL,
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": toAsciiSafeJson({
        path,
        mode: { ".tag": "overwrite" },
        mute: true,
      }),
    },
    body: file,
    onUploadProgress: toProgressRatioHandler(onProgress),
  })
