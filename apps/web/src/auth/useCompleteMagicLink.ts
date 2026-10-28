import { from, switchMap } from "rxjs"
import { useHttpClientApi } from "../http"
import { useMutation$ } from "reactjrx"
import { useReCreateDb } from "../rxdb"
import { completeAuthentication } from "./completeAuthentication"
import { useForgetAccountSessions } from "./useForgetAccountSessions"
import { usePutProfile } from "../profiles"
import { getOrCreateInstallationId } from "../common/browser"
import { createProofKey } from "./proofKey"
import { withLock } from "../common/locks/utils"
import { useQueryClient } from "@tanstack/react-query"

export const useCompleteMagicLink = () => {
  const httpClientApi = useHttpClientApi()
  const { mutateAsync: reCreateDb } = useReCreateDb()
  const { mutateAsync: putProfile } = usePutProfile()
  const forgetAccountSessions = useForgetAccountSessions()
  const queryClient = useQueryClient()

  return useMutation$({
    mutationFn: (data: { token: string }) => {
      return from(createProofKey()).pipe(
        switchMap((proofKey) =>
          from(
            httpClientApi.authWithMagicLink(
              {
                ...data,
                installation_id: getOrCreateInstallationId(),
                public_key: proofKey.publicJwk,
              },
              proofKey,
            ),
          ).pipe(
            switchMap(({ data: auth }) =>
              completeAuthentication({
                reCreateDb,
                putProfile,
                forgetAccountSessions,
                auth,
                queryClient,
              }),
            ),
          ),
        ),
        withLock("magic-link-complete"),
      )
    },
  })
}
