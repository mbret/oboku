import type { RequestMagicLinkRequest } from "@oboku/shared"
import { finalize, from } from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { httpClientApi } from "../http/httpClientApi.web"
import { useMutation$ } from "reactjrx"

export const useRequestMagicLink = () => {
  return useMutation$({
    mutationFn: (data: RequestMagicLinkRequest) => {
      lock("magic-link-request")

      return from(httpClientApi.requestMagicLink(data)).pipe(
        finalize(() => {
          unlock("magic-link-request")
        }),
      )
    },
  })
}
