import { map } from "rxjs"
import { httpClientWeb } from "../../../http/httpClient.web"
import { toProgressRatioHandler } from "../../../http/toProgressRatioHandler"

type Params = {
  fileId: string
  file: Blob | File
  accessToken: string
  contentType?: string
  onProgress?: (progress: number) => void
}

const parseHeadRevisionId = (responseText: string) => {
  const payload: unknown = JSON.parse(responseText)

  return payload !== null &&
    typeof payload === "object" &&
    "headRevisionId" in payload &&
    typeof payload.headRevisionId === "string"
    ? payload.headRevisionId
    : undefined
}

export const updateDriveFileMedia = ({
  fileId,
  file,
  accessToken,
  contentType,
  onProgress,
}: Params) =>
  httpClientWeb
    .upload$({
      url: `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true&fields=headRevisionId`,
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": contentType ?? file.type ?? "application/octet-stream",
      },
      body: file,
      onUploadProgress: toProgressRatioHandler(onProgress),
    })
    .pipe(
      map(function toUpdatedFile({ data }) {
        return { headRevisionId: parseHeadRevisionId(data) }
      }),
    )
