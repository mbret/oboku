import {
  type GoogleAccessTokenResponseDto,
  googleConnectionMintAccessToken,
  ObokuErrorCode,
} from "@oboku/shared"
import type { QueryClient } from "@tanstack/react-query"
import { Logger } from "../../../debug/logger.shared"
import { errorToMessage } from "../../../errors/ErrorMessage"
import { isApiError } from "../../../errors/errors.shared"
import type { HttpApiClientWeb } from "../../../http"
import { notify } from "../../../notifications/toasts"
import { cancelUnlessProfileIsActive } from "../../../profiles/active/activeProfileId"
import type { GoogleAccessToken } from "../auth"
import { createGoogleConnectionQueryOptions } from "./useGoogleConnection"

const hasErrorCode = (error: unknown, code: ObokuErrorCode) =>
  isApiError(error) && error.response.data.errors[0]?.code === code

const toGoogleAccessToken = (
  { accessToken, expiresAt, scopes }: GoogleAccessTokenResponseDto,
  receivedAt: number,
): GoogleAccessToken => {
  const lifetimeSeconds = Math.floor(
    (Date.parse(expiresAt) - receivedAt) / 1000,
  )

  return {
    access_token: accessToken,
    expires_in: String(lifetimeSeconds),
    scope: scopes.join(" "),
    token_type: "Bearer",
    created_at: receivedAt,
  }
}

/**
 * Asks oboku's server for a Drive access token, minted from the refresh token
 * of the user's Google connection.
 *
 * @returns the token, or `null` when the server has none to give: the user
 * has not connected, the connection is lost (the user is told, and the
 * connection shows as gone), or the request failed. Google's sign-in then
 * takes over.
 * @throws `CancelError` when the active profile changed meanwhile: the token
 * belongs to the previous profile's account.
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
  const accessToken = await googleConnectionMintAccessToken({
    client: httpClientApi.sdkClient,
  }).then(
    function toTokenOfConnection({ data }) {
      return toGoogleAccessToken(data, Date.now())
    },
    function giveUpOnConnection(error: unknown) {
      const isConnectionLost = hasErrorCode(
        error,
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_LOST,
      )
      const isConnectionUnavailable =
        hasErrorCode(
          error,
          ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_FOUND,
        ) ||
        hasErrorCode(
          error,
          ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_CONFIGURED,
        )

      if (isConnectionLost) {
        queryClient.setQueryData(
          createGoogleConnectionQueryOptions({ httpClientApi, profileId })
            .queryKey,
          { connection: null },
        )
        notify({
          title: "Google account disconnected",
          description: errorToMessage(error),
          severity: "warning",
        })
      } else if (!isConnectionUnavailable) {
        Logger.error("Failed to mint a Google access token", error)
      }

      return null
    },
  )

  cancelUnlessProfileIsActive(profileId)

  return accessToken
}
