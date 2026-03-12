import { useMutation } from "@tanstack/react-query"
import type { BookQueryResult } from "../books/states"
import { downloadFlowRequestsSignal } from "./flow/states"

let requestId = 0

export const useDownloadBook = () => {
  return useMutation({
    mutationFn: ({
      _id: bookId,
      links,
      file,
    }: Pick<BookQueryResult, `_id` | `links`> & {
      file?: File
    }) =>
      new Promise<void>((resolve, reject) => {
        requestId += 1

        downloadFlowRequestsSignal.setValue((requests) => [
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
        ])
      }),
  })
}
