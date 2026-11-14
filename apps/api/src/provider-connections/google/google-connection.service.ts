import { Injectable } from "@nestjs/common"
import { GOOGLE_DRIVE_FILE_SCOPE, ObokuErrorCode } from "@oboku/shared"
import { OAuth2Client } from "google-auth-library"
import {
  type InstanceConfig,
  InstanceConfigService,
} from "../../admin/instance-config/instance-config.service.js"
import { toGoogleApiFailure } from "../../http/googleApiFailure.js"
import { isRecord } from "../../http/isRecord.js"
import { createObokuBadRequest } from "../../http/obokuBadRequest.js"
import {
  type ConnectionProvider,
  ProviderConnectionsService,
} from "../provider-connections.service.js"
import type {
  GoogleAccessTokenResponseDto,
  GoogleConnectionDto,
} from "./google-connection.dto.js"

const GOOGLE_PROVIDER = "google" satisfies ConnectionProvider

/** The redirect URI of a code from Google Identity Services' popup code flow. */
const POPUP_REDIRECT_URI = "postmessage"

/**
 * What Google answers for a code or refresh token it will never honour: wrong,
 * expired, revoked, or issued to another client (RFC 6749 §5.2). Every other
 * error, such as `unauthorized_client`, concerns the client's configuration
 * and every user's grant, so it never drops a connection.
 */
const INVALID_GRANT_ERROR = "invalid_grant"

type GoogleOAuthClientOptions = { clientId: string; clientSecret: string }

/** The OAuth client a code is exchanged with, `null` until the admin sets its id and secret. */
const toGoogleOAuthClientOptions = ({
  googleClientId,
  googleClientSecret,
}: Pick<
  InstanceConfig,
  "googleClientId" | "googleClientSecret"
>): GoogleOAuthClientOptions | null =>
  googleClientId && googleClientSecret
    ? { clientId: googleClientId, clientSecret: googleClientSecret }
    : null

export const isGoogleConnectionConfigured = (
  config: Pick<InstanceConfig, "googleClientId" | "googleClientSecret">,
) => toGoogleOAuthClientOptions(config) !== null

/** The OAuth error in Google's answer to a refused exchange, such as `invalid_grant`. */
const toOAuthError = (error: unknown) => {
  const { body } = toGoogleApiFailure(error)
  const oauthError = isRecord(body) ? body.error : undefined

  return typeof oauthError === "string" ? oauthError : undefined
}

/**
 * Google's failure without gaxios's error, whose request config carries the
 * code or the refresh token the request sent.
 */
const createGoogleFailure = (
  operation: string,
  oauthError: string | undefined,
) => new Error(`${operation}: ${oauthError ?? "no OAuth error in the answer"}`)

/** Exchanges the code for Google's tokens. */
const exchangeCode = async (client: OAuth2Client, code: string) => {
  try {
    const { tokens } = await client.getToken(code)

    return tokens
  } catch (error) {
    const oauthError = toOAuthError(error)
    const isCodeRefused = oauthError === INVALID_GRANT_ERROR

    if (isCodeRefused) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_CODE_REFUSED,
      )
    }

    throw createGoogleFailure(
      "The code exchange with Google failed",
      oauthError,
    )
  }
}

/** `null` once Google will never honour the refresh token again. */
const refreshAccessToken = async ({
  clientOptions,
  refreshToken,
}: {
  clientOptions: GoogleOAuthClientOptions
  refreshToken: string
}) => {
  const client = new OAuth2Client(clientOptions)

  client.setCredentials({ refresh_token: refreshToken })

  try {
    const { credentials } = await client.refreshAccessToken()

    return credentials
  } catch (error) {
    const oauthError = toOAuthError(error)
    const isRefreshTokenRefused = oauthError === INVALID_GRANT_ERROR

    if (isRefreshTokenRefused) return null

    throw createGoogleFailure(
      "Google refused to refresh the access token",
      oauthError,
    )
  }
}

/**
 * The account in the ID token, once verified. A failure is rethrown without
 * google-auth-library's error, whose message quotes the token or its payload.
 */
const verifyAccount = async ({
  client,
  idToken,
  audience,
}: {
  client: OAuth2Client
  idToken: string
  audience: string
}) => {
  try {
    const ticket = await client.verifyIdToken({ idToken, audience })

    return ticket.getPayload()
  } catch {
    throw new Error(
      "Google's ID token for the connected account did not verify",
    )
  }
}

/** The Google account whose Drive files the API reaches for a user. */
@Injectable()
export class GoogleConnectionService {
  constructor(
    private readonly instanceConfigService: InstanceConfigService,
    private readonly providerConnectionsService: ProviderConnectionsService,
  ) {}

  async find(userId: number): Promise<GoogleConnectionDto | null> {
    const connection = await this.providerConnectionsService.find({
      userId,
      provider: GOOGLE_PROVIDER,
    })

    if (!connection) return null

    return {
      accountName: connection.accountName,
      connectedAt: connection.connectedAt.toISOString(),
    }
  }

  /**
   * Whether the API can reach the user's Drive, as far as it can tell without
   * asking Google: the instance can connect accounts, and the user's
   * connection holds credentials the API can still decrypt.
   */
  async isConnected(userId: number) {
    const isConfigured = isGoogleConnectionConfigured(
      this.instanceConfigService.getConfig().value,
    )
    const credentials = isConfigured
      ? await this.providerConnectionsService.getCredentials({
          userId,
          provider: GOOGLE_PROVIDER,
        })
      : null

    return credentials !== null
  }

  /**
   * Exchanges a code from Google's popup for a refresh token, with the client
   * the web app signs in with, and keeps it encrypted. Replaces the user's
   * previous Google connection.
   */
  async connect({ userId, code }: { userId: number; code: string }) {
    const clientOptions = toGoogleOAuthClientOptions(
      this.instanceConfigService.getConfig().value,
    )

    if (!clientOptions) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_CONFIGURED,
      )
    }

    const client = new OAuth2Client({
      ...clientOptions,
      redirectUri: POPUP_REDIRECT_URI,
    })
    const tokens = await exchangeCode(client, code)
    const scopes = tokens.scope?.split(" ") ?? []
    const isDriveGranted = scopes.includes(GOOGLE_DRIVE_FILE_SCOPE)
    const openIdToken = tokens.id_token

    if (!isDriveGranted || !openIdToken) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SCOPE_NOT_GRANTED,
      )
    }

    const account = await verifyAccount({
      client,
      idToken: openIdToken,
      audience: clientOptions.clientId,
    })
    const grantedEmail = account?.email

    if (!account || !grantedEmail) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SCOPE_NOT_GRANTED,
      )
    }

    // Google issues a refresh token only with a user's first grant to oboku,
    // until it is revoked: the popup code flow cannot ask for consent again.
    if (!tokens.refresh_token) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NO_REFRESH_TOKEN,
      )
    }

    await this.providerConnectionsService.connect({
      userId,
      provider: GOOGLE_PROVIDER,
      credentials: { refreshToken: tokens.refresh_token },
      accountId: account.sub,
      accountName: grantedEmail,
      scopes,
    })

    return this.find(userId)
  }

  /**
   * Mints an access token from the stored refresh token. A connection whose
   * refresh token Google refuses, or whose credentials no longer decrypt, is
   * lost: it is deleted, and the user connects again.
   */
  async mintAccessToken(userId: number): Promise<GoogleAccessTokenResponseDto> {
    const clientOptions = toGoogleOAuthClientOptions(
      this.instanceConfigService.getConfig().value,
    )

    if (!clientOptions) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_CONFIGURED,
      )
    }

    const connection = await this.providerConnectionsService.find({
      userId,
      provider: GOOGLE_PROVIDER,
    })

    if (!connection) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NOT_FOUND,
      )
    }

    const credentials = await this.providerConnectionsService.getCredentials({
      userId,
      provider: GOOGLE_PROVIDER,
    })
    const tokensOfLiveConnection =
      credentials &&
      (await refreshAccessToken({
        clientOptions,
        refreshToken: credentials.refreshToken,
      }))

    if (!tokensOfLiveConnection) {
      await this.disconnect(userId)

      throw createObokuBadRequest(ObokuErrorCode.ERROR_PROVIDER_CONNECTION_LOST)
    }

    const {
      access_token: accessToken,
      expiry_date: expiryDate,
      scope,
    } = tokensOfLiveConnection

    if (!accessToken || !expiryDate) {
      throw new Error(
        "Google's refresh answer lacks the access token or its expiry",
      )
    }

    return {
      accessToken,
      expiresIn: Math.floor((expiryDate - Date.now()) / 1000),
      scopes: scope?.split(" ") ?? connection.scopes,
    }
  }

  /**
   * Deletes the stored refresh token. Google keeps oboku's grant, so the
   * browser's sign-in and the user's picked files keep working.
   */
  disconnect(userId: number) {
    return this.providerConnectionsService.disconnect({
      userId,
      provider: GOOGLE_PROVIDER,
    })
  }
}
