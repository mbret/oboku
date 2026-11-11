import { Injectable } from "@nestjs/common"
import {
  AtRestCipher,
  PROVIDER_CONNECTION_CREDENTIALS_PURPOSE,
} from "../crypto/at-rest-cipher.js"
import { ProviderConnectionPostgresService } from "../features/postgres/provider-connection-postgres.service.js"

/** What each account provider grants, as the API keeps it. */
export type ProviderCredentials = {
  google: { refreshToken: string }
}

export type ConnectionProvider = keyof ProviderCredentials

type ConnectionKey<P extends ConnectionProvider = ConnectionProvider> = {
  userId: number
  provider: P
}

const credentialsParsers: {
  [P in ConnectionProvider]: (value: unknown) => ProviderCredentials[P] | null
} = {
  google: function parseGoogleCredentials(value) {
    const hasRefreshToken =
      typeof value === "object" && value !== null && "refreshToken" in value

    if (!hasRefreshToken || typeof value.refreshToken !== "string") return null

    return { refreshToken: value.refreshToken }
  },
}

/** Binds the credentials to their row, so they cannot be copied into another one. */
const toAssociatedData = ({ userId, provider }: ConnectionKey) =>
  `${userId}:${provider}`

/** The long-lived permissions users give the API at account providers. */
@Injectable()
export class ProviderConnectionsService {
  constructor(
    private readonly connectionPostgresService: ProviderConnectionPostgresService,
    private readonly atRestCipher: AtRestCipher,
  ) {}

  /** The connection without its credentials, or `null`. */
  async find(key: ConnectionKey) {
    const connection = await this.connectionPostgresService.find(key)

    if (!connection) return null

    return {
      accountId: connection.account_id,
      accountName: connection.account_name,
      scopes: connection.scopes,
      connectedAt: connection.connected_at,
      updatedAt: connection.updated_at,
    }
  }

  /** Replaces the user's previous connection to the provider, if any. */
  async connect<P extends ConnectionProvider>({
    userId,
    provider,
    credentials,
    accountId,
    accountName,
    scopes,
  }: ConnectionKey<P> & {
    credentials: ProviderCredentials[P]
    accountId: string
    accountName: string
    scopes: string[]
  }) {
    const encryptedCredentials = await this.atRestCipher.encrypt({
      purpose: PROVIDER_CONNECTION_CREDENTIALS_PURPOSE,
      plaintext: JSON.stringify(credentials),
      associatedData: toAssociatedData({ userId, provider }),
    })

    await this.connectionPostgresService.save({
      userId,
      provider,
      encryptedCredentials,
      accountId,
      accountName,
      scopes,
    })
  }

  /**
   * `null` without a connection, or when its credentials no longer decrypt,
   * such as after the JWT private key was replaced.
   */
  async getCredentials<P extends ConnectionProvider>(
    key: ConnectionKey<P>,
  ): Promise<ProviderCredentials[P] | null> {
    const connection = await this.connectionPostgresService.find(key)

    if (!connection) return null

    const plaintext = await this.atRestCipher.decrypt({
      purpose: PROVIDER_CONNECTION_CREDENTIALS_PURPOSE,
      ciphertext: connection.encrypted_credentials,
      associatedData: toAssociatedData(key),
    })

    if (plaintext === null) return null

    return credentialsParsers[key.provider](JSON.parse(plaintext))
  }

  async disconnect(key: ConnectionKey) {
    await this.connectionPostgresService.delete(key)
  }
}
