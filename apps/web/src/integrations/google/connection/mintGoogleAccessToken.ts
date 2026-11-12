import {
  type GoogleAccessTokenResponseDto,
  googleConnectionMintAccessToken,
  ObokuErrorCode,
} from "@oboku/shared"
import type { QueryClient } from "@tanstack/react-query"
import { Logger } from "../../../debug/logger.shared"
import { errorToMessage } from "../../../errors/ErrorMessage"
import { hasApiErrorCode } from "../../../errors/errors.shared"
import type { HttpApiClientWeb } from "../../../http"
import { notify } from "../../../notifications/toasts"
import { cancelUnlessProfileIsActive } from "../../../profiles/active/activeProfileId"
import type { GoogleAccessToken } from "../auth"
import { createGoogleConnectionQueryOptions } from "./googleConnectionQueryOptions"

const toGoogleAccessToken = (
  { accessToken, expiresIn, scopes }: GoogleAccessTokenResponseDto,
  receivedAt: number,
): GoogleAccessToken => ({
  access_token: accessToken,
  expires_in: String(expiresIn),
  scope: scopes.join(" "),
  token_type: "Bearer",
  created_at: receivedAt,
})

/**
 * Asks oboku's server for a Drive access token, minted from the refresh token
 * of the user's Google connection.
 *
 * @returns the token, or `null` when the server has none to give: the user
 * has not connected (the connection shows as gone), the connection is lost
 * (the user is also told), or the request failed. Google's sign-in then takes
 * over.
 * @throws `CancelError` when the active profile changed meanwhile: the answer
 * concerns the previous profile's account.
 */
export const mintGoogleAccessToken = async ({
  httpClientApi,
  queryClient,
  profileId,
}: {
  httpClientApi: HttpApiClientWeb
  queryClient: QueryClient
  profileId: string | undefined
}) => {
  const [answer] = await Promise.allSettled([
    googleConnectionMintAccessToken({ client: httpClientApi.sdkClient }),
  ])

  cancelUnlessProfileIsActive(profileId)

  if (answer.status === "fulfilled") {
    return toGoogleAccessToken(answer.value.data, Date.now())
  }

  const error = answer.reason
  const isConnectionLost = hasApiErrorCode(
    error,
    ObokuErrorCode.ERROR_PROVIDER_CONNECTION_LOST,
  )
  const isConnectionMissing =
    isConnectionLost ||
    hasApiErrorCode(error, ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_FOUND)
  const isConnectionUnavailable =
    isConnectionMissing ||
    hasApiErrorCode(
      error,
      ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_CONFIGURED,
    )

  if (isConnectionMissing) {
    queryClient.setQueryData(
      createGoogleConnectionQueryOptions({ httpClientApi, profileId }).queryKey,
      { connection: null },
    )
  }

  if (isConnectionLost) {
    notify({
      title: "Google account disconnected",
      description: errorToMessage(error),
      severity: "warning",
    })
  }

  if (!isConnectionUnavailable) {
    Logger.error("Failed to mint a Google access token", error)
  }

  return null
}
