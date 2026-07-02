import type { SignInWithGoogleRequest } from "@oboku/shared"
import { from, map, switchMap } from "rxjs"
import { useReCreateDb } from "../rxdb"
import { httpClientApi } from "../http/httpClientApi.web"
import { useMutation$ } from "reactjrx"
import { signInWithGooglePrompt } from "../google/auth"
import { useConfig } from "../config/useConfig"
import { completeAuthentication } from "./completeAuthentication"
import { getOrCreateAuthInstallationId } from "./installationId"
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
  const { mutateAsync: reCreateDb } = useReCreateDb()
  const queryClient = useQueryClient()
  const { data: config } = useConfig()

  return useMutation$<SignInData, DefaultError, SignInVariables>({
    ...options,
    mutationFn: (data) => {
      const installationId = getOrCreateAuthInstallationId()

      const signIn$ = data
        ? from(
            httpClientApi.signInWithEmail({
              ...data,
              installation_id: installationId,
            }),
          )
        : signInWithGooglePrompt(config?.GOOGLE_CLIENT_ID ?? "").pipe(
            map(
              (authResponse): SignInWithGoogleRequest => ({
                token: authResponse.credential,
                installation_id: installationId,
              }),
            ),
            switchMap((credentials) =>
              from(httpClientApi.signInWithGoogle(credentials)),
            ),
          )

      return signIn$.pipe(
        switchMap(({ data }) =>
          completeAuthentication({
            reCreateDb,
            auth: data,
            queryClient,
          }),
        ),
        withLock("authentication"),
      )
    },
  })
}
