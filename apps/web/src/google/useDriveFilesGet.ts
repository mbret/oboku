import { from } from "rxjs"
import { useCallback } from "react"

type Params = NonNullable<Parameters<typeof gapi.client.drive.files.get>[0]>

export type DriveFileGetResponse = Awaited<
  ReturnType<typeof gapi.client.drive.files.get>
>

type DriveResponseError = {
  body?: string
  // biome-ignore lint/complexity/noBannedTypes: TODO
  headers?: {}
  result?: {
    error?: {
      code?: number
      message?: string
      errors?: []
    }
  }
  status?: number
  statusText?: string | null
}

export const isDriveResponseError = (
  response: unknown,
): response is DriveResponseError => {
  return (
    !!response &&
    typeof response === "object" &&
    "status" in response &&
    typeof response.status === "number"
  )
}

export const useDriveFilesGet = () => {
  return useCallback(
    (_gapi: typeof gapi, params: Params) =>
      from(_gapi.client.drive.files.get(params)),
    [],
  )
}
