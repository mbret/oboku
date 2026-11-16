import { Injectable } from "@nestjs/common"
import type { WebdavConnectorDocType } from "@oboku/shared"
import {
  AtRestCipher,
  PROVIDER_CONNECTION_CREDENTIALS_PURPOSE,
} from "../crypto/at-rest-cipher.js"
import type { ProviderConnectionPostgresEntity } from "../features/postgres/entities.js"
import { ProviderConnectionPostgresService } from "../features/postgres/provider-connection-postgres.service.js"
import { isRecord } from "../http/isRecord.js"
import { isWebdavConnector } from "../plugins/webdav/index.js"

/**
 * What each account provider grants, as the API keeps it. A connector's
 * credentials hold the connector as it was when the user connected it.
 */
export type ProviderCredentials = {
  google: { refreshToken: string }
  webdav: { connector: WebdavConnectorDocType; password: string }
}

export type ConnectionProvider = keyof ProviderCredentials

type ProviderKey<P extends ConnectionProvider = ConnectionProvider> = {
  userId: number
  provider: P
}

type ConnectionKey<P extends ConnectionProvider = ConnectionProvider> =
  ProviderKey<P> & { accountId: string }

/** A provider with its own credentials, never another provider's. */
type ProviderAndCredentials = {
  [P in ConnectionProvider]: {
    provider: P
    credentials: ProviderCredentials[P]
  }
}[ConnectionProvider]

const credentialsParsers: {
  [P in ConnectionProvider]: (value: unknown) => ProviderCredentials[P] | null
} = {
  google: function parseGoogleCredentials(value) {
    const hasRefreshToken =
      typeof value === "object" && value !== null && "refreshToken" in value

    if (!hasRefreshToken || typeof value.refreshToken !== "string") return null

    return { refreshToken: value.refreshToken }
  },
  webdav: function parseWebdavCredentials(value) {
    if (!isRecord(value)) return null

    const { connector, password } = value
    const isWebdavCredentials =
      typeof password === "string" && isWebdavConnector(connector)

    if (!isWebdavCredentials) return null

    return { connector, password }
  },
}

/** `undefined` for invalid JSON, without the error, whose message quotes the input. */
const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Binds the credentials to their connection, so they cannot be copied to another one. */
const toAssociatedData = ({ userId, provider, accountId }: ConnectionKey) =>
  `${userId}:${provider}:${accountId}`

/**
 * Credentials saved while a user had at most one connection per provider are
 * bound to the user and provider only. They stay readable until the user
 * connects that account again.
 */
const toProviderWideAssociatedData = ({ userId, provider }: ProviderKey) =>
  `${userId}:${provider}`

const toConnectionWithoutCredentials = (
  connection: ProviderConnectionPostgresEntity,
) => ({
  accountId: connection.account_id,
  accountName: connection.account_name,
  scopes: connection.scopes,
  connectedAt: connection.connected_at,
  updatedAt: connection.updated_at,
})

/** The long-lived permissions users give the API at account providers. */
@Injectable()
export class ProviderConnectionsService {
  constructor(
    private readonly connectionPostgresService: ProviderConnectionPostgresService,
    private readonly atRestCipher: AtRestCipher,
  ) {}

  /** The user's connections to the provider without their credentials, the latest first. */
  async list(key: ProviderKey) {
    const connections = await this.connectionPostgresService.list(key)

    return connections.map(toConnectionWithoutCredentials)
  }

  /**
   * Replaces the user's previous connection to the same account, if any. With
   * `replacesOtherAccounts`, also deletes the user's connections to the
   * provider's other accounts, in one step.
   */
  async connect({
    userId,
    provider,
    credentials,
    accountId,
    accountName,
    scopes,
    replacesOtherAccounts = false,
  }: ProviderAndCredentials & {
    userId: number
    accountId: string
    accountName: string
    scopes: string[]
    replacesOtherAccounts?: boolean
  }) {
    const encryptedCredentials = await this.atRestCipher.encrypt({
      purpose: PROVIDER_CONNECTION_CREDENTIALS_PURPOSE,
      plaintext: JSON.stringify(credentials),
      associatedData: toAssociatedData({ userId, provider, accountId }),
    })
    const connection = {
      userId,
      provider,
      accountId,
      encryptedCredentials,
      accountName,
      scopes,
    }

    if (replacesOtherAccounts) {
      await this.connectionPostgresService.saveAsOnlyAccount(connection)
    } else {
      await this.connectionPostgresService.save(connection)
    }
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

    const decryptBoundTo = (associatedData: string) =>
      this.atRestCipher.decrypt({
        purpose: PROVIDER_CONNECTION_CREDENTIALS_PURPOSE,
        ciphertext: connection.encrypted_credentials,
        associatedData,
      })
    const plaintext =
      (await decryptBoundTo(toAssociatedData(key))) ??
      (await decryptBoundTo(toProviderWideAssociatedData(key)))

    if (plaintext === null) return null

    return credentialsParsers[key.provider](parseJson(plaintext))
  }

  async disconnect(key: ConnectionKey) {
    await this.connectionPostgresService.delete(key)
  }
}
