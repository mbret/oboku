import { BadRequestException, Injectable } from "@nestjs/common"
import { GOOGLE_DRIVE_FILE_SCOPE, ObokuErrorCode } from "@oboku/shared"
import { OAuth2Client } from "google-auth-library"
import {
  type InstanceConfig,
  InstanceConfigService,
} from "../../admin/instance-config/instance-config.service.js"
import {
  type ConnectionProvider,
  ProviderConnectionsService,
} from "../provider-connections.service.js"
import type { GoogleConnectionDto } from "./google-connection.dto.js"

const GOOGLE_PROVIDER = "google" satisfies ConnectionProvider

/** The redirect URI of a code from Google Identity Services' popup code flow. */
const POPUP_REDIRECT_URI = "postmessage"

/** What Google answers for a code that is wrong, expired or already used (RFC 6749 §5.2). */
const INVALID_GRANT_ERROR = "invalid_grant"

const createConnectionError = (code: ObokuErrorCode) =>
  new BadRequestException({ errors: [{ code }] })

/** The OAuth client a code is exchanged with, `null` until the admin sets its id and secret. */
export const toGoogleOAuthClientOptions = ({
  googleClientId,
  googleClientSecret,
}: Pick<InstanceConfig, "googleClientId" | "googleClientSecret">) =>
  googleClientId && googleClientSecret
    ? { clientId: googleClientId, clientSecret: googleClientSecret }
    : null

/** The OAuth error in Google's answer to a refused exchange, such as `invalid_grant`. */
const toOAuthError = (error: unknown) => {
  const response =
    typeof error === "object" && error !== null && "response" in error
      ? error.response
      : undefined
  const body =
    typeof response === "object" && response !== null && "data" in response
      ? response.data
      : undefined
  const oauthError =
    typeof body === "object" && body !== null && "error" in body
      ? body.error
      : undefined

  return typeof oauthError === "string" ? oauthError : undefined
}

/**
 * Exchanges the code for Google's tokens. A failure the user cannot fix is
 * rethrown without Google's error, whose request config carries the code.
 */
const exchangeCode = async (client: OAuth2Client, code: string) => {
  try {
    const { tokens } = await client.getToken(code)

    return tokens
  } catch (error) {
    const oauthError = toOAuthError(error)
    const isCodeRefused = oauthError === INVALID_GRANT_ERROR

    if (isCodeRefused) {
      throw createConnectionError(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_CODE_REFUSED,
      )
    }

    throw new Error(
      `The code exchange with Google failed: ${oauthError ?? "no OAuth error in the answer"}`,
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
   * Exchanges a code from Google's popup for a refresh token, with the client
   * the web app signs in with, and keeps it encrypted. Replaces the user's
   * previous Google connection.
   */
  async connect({ userId, code }: { userId: number; code: string }) {
    const clientOptions = toGoogleOAuthClientOptions(
      this.instanceConfigService.getConfig().value,
    )

    if (!clientOptions) {
      throw createConnectionError(
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

    // Google sends an ID token only with the `openid` scope.
    if (!isDriveGranted || !tokens.id_token) {
      throw createConnectionError(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SCOPE_NOT_GRANTED,
      )
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientOptions.clientId,
    })
    const account = ticket.getPayload()

    // The ID token carries the email only with the `email` scope.
    if (!account?.email) {
      throw createConnectionError(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SCOPE_NOT_GRANTED,
      )
    }

    // Google issues a refresh token only when the user first grants access,
    // until the grant is revoked.
    if (!tokens.refresh_token) {
      throw createConnectionError(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_NO_REFRESH_TOKEN,
      )
    }

    await this.providerConnectionsService.connect({
      userId,
      provider: GOOGLE_PROVIDER,
      credentials: { refreshToken: tokens.refresh_token },
      accountId: account.sub,
      accountName: account.email,
      scopes,
    })

    return this.find(userId)
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
