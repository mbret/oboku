import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
} from "@tanstack/react-query"
import type { BookQueryResult } from "../books/states"
import { downloadFlowRequestsSignal } from "./flow/states"

let requestId = 0

type DownloadBookVariables = Pick<BookQueryResult, `_id` | `links`> & {
  file?: File
}

export const useDownloadBook = (
  options?: Pick<
    UseMutationOptions<void, DefaultError, DownloadBookVariables>,
    "meta"
  >,
) => {
  return useMutation({
    ...options,
    mutationFn: function enqueueBookDownload({
      _id: bookId,
      links,
      file,
    }: DownloadBookVariables) {
      return new Promise<void>(function appendDownloadRequest(resolve, reject) {
        requestId += 1

        downloadFlowRequestsSignal.setValue(function appendRequest(requests) {
          return [
            ...requests,
            {
              abortController: new AbortController(),
              bookId,
              file,
              id: requestId.toString(),
              links,
              reject,
              resolve,
            },
          ]
        })
      })
    },
  })
}
