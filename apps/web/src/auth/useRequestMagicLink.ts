import type { RequestMagicLinkRequest } from "@oboku/shared"
import { from } from "rxjs"
import { httpClientApi } from "../http/httpClientApi.web"
import { useMutation$ } from "reactjrx"
import { withLock } from "../common/locks/utils"

export const useRequestMagicLink = () => {
  return useMutation$({
    mutationFn: (data: RequestMagicLinkRequest) =>
      from(httpClientApi.requestMagicLink(data)).pipe(
        withLock("magic-link-request"),
      ),
  })
}
