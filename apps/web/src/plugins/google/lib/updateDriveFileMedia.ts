import { httpClientWeb } from "../../../http/httpClient.web"
import { toProgressRatioHandler } from "../../../http/toProgressRatioHandler"

type Params = {
  fileId: string
  file: Blob | File
  accessToken: string
  contentType?: string
  onProgress?: (progress: number) => void
}

export const updateDriveFileMedia = ({
  fileId,
  file,
  accessToken,
  contentType,
  onProgress,
}: Params) =>
  httpClientWeb.upload$({
    url: `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType ?? file.type ?? "application/octet-stream",
    },
    body: file,
    onUploadProgress: toProgressRatioHandler(onProgress),
  })
