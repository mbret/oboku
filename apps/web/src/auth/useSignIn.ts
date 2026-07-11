import type { SignInWithGoogleRequest } from "@oboku/shared"
import { from, switchMap } from "rxjs"
import { useReCreateDb } from "../rxdb"
import { useHttpClientApi } from "../http"
import { useMutation$ } from "reactjrx"
import { signInWithGooglePrompt } from "../google/auth"
import { useConfig } from "../config/useConfig"
import { completeAuthentication } from "./completeAuthentication"
import { usePutProfile } from "../profiles"
import { getOrCreateAuthInstallationId } from "./installationId"
import { createProofKey } from "./proofKey"
import { withLock } from "../common/locks/utils"
import {
  type DefaultError,
  type UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query"

type SignInVariables = { email: string; password: string } | undefined
type SignInData = { switchedAccount: boolean }

export const useSignIn = (
  options?: Pick<
    UseMutationOptions<SignInData, DefaultError, SignInVariables>,
    "onSuccess" | "onError" | "onSettled"
  >,
) => {
  const httpClientApi = useHttpClientApi()
  const { mutateAsync: reCreateDb } = useReCreateDb()
  const { mutateAsync: putProfile } = usePutProfile()
  const queryClient = useQueryClient()
  const { data: config } = useConfig()

  return useMutation$<SignInData, DefaultError, SignInVariables>({
    ...options,
    mutationFn: (data) => {
      const installationId = getOrCreateAuthInstallationId()

      return from(createProofKey()).pipe(
        switchMap((proofKey) =>
          (data
            ? from(
                httpClientApi.signInWithEmail(
                  {
                    ...data,
                    installation_id: installationId,
                    public_key: proofKey.publicJwk,
                  },
                  proofKey,
                ),
              )
            : signInWithGooglePrompt(config?.GOOGLE_CLIENT_ID ?? "").pipe(
                switchMap((authResponse) =>
                  from(
                    httpClientApi.signInWithGoogle(
                      {
                        token: authResponse.credential,
                        installation_id: installationId,
                        public_key: proofKey.publicJwk,
                      } satisfies SignInWithGoogleRequest,
                      proofKey,
                    ),
                  ),
                ),
              )
          ).pipe(
            switchMap(({ data: auth }) =>
              completeAuthentication({
                reCreateDb,
                putProfile,
                auth,
                queryClient,
              }),
            ),
          ),
        ),
        withLock("authentication"),
      )
    },
  })
}
