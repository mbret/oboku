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
      sendXhr<Blob>(
        { ...params, method: "GET" },
        (xhr) => xhr.response as Blob,
      ),
    gcTime: 0,
    ...options,
  })

export type Download = ReturnType<typeof useDownload>["mutateAsync"]
