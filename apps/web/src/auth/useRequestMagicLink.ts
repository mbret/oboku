import type { RequestMagicLinkRequest } from "@oboku/shared"
import { from } from "rxjs"
import { useHttpClientApi } from "../http"
import { useMutation$ } from "reactjrx"
import { withLock } from "../common/locks/utils"

export const useRequestMagicLink = () => {
  const httpClientApi = useHttpClientApi()

  return useMutation$({
    mutationFn: (data: RequestMagicLinkRequest) =>
      from(httpClientApi.requestMagicLink(data)).pipe(
        withLock("magic-link-request"),
      ),
  })
}
