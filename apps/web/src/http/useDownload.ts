import { useMutation, type UseMutationOptions } from "@tanstack/react-query"
import {
  type DownloadParams,
  type XhrResponse,
  sendXhr,
} from "./httpClient.web"

type DownloadOptions = Omit<
  UseMutationOptions<XhrResponse<Blob>, unknown, DownloadParams>,
  "mutationFn"
>

export const useDownload = (options?: DownloadOptions) =>
  useMutation({
    mutationFn: (params: DownloadParams) =>
      sendXhr<Blob>({ ...params, method: "GET" }, (xhr) => {
        if (!(xhr.response instanceof Blob)) {
          throw new Error("Expected download response to be a Blob")
        }

        return xhr.response
      }),
    gcTime: 0,
    ...options,
  })

export type Download = ReturnType<typeof useDownload>["mutateAsync"]
