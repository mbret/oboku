import { Injectable } from "@nestjs/common"
import type { SecretDocType, WebdavConnectorDocType } from "@oboku/shared"
import {
  AtRestCipher,
  PROVIDER_CONNECTION_CREDENTIALS_PURPOSE,
} from "../crypto/at-rest-cipher.js"
import type { ProviderConnectionPostgresEntity } from "../features/postgres/entities.js"
import { ProviderConnectionPostgresService } from "../features/postgres/provider-connection-postgres.service.js"
import { isRecord } from "../http/isRecord.js"
import { isWebdavConnector } from "../plugins/webdav/index.js"

/** A secret's value as the app stores it, encrypted with the user's master key. */
export type EncryptedSecretValue = NonNullable<SecretDocType["value"]>

/**
 * What each account provider grants, as the API keeps it. A connector's
 * credentials hold the connector, and its password secret's encrypted value,
 * as they were when the user connected it.
 */
export type ProviderCredentials = {
  google: { refreshToken: string }
  webdav: {
    connector: WebdavConnectorDocType
    passwordSecretValue: EncryptedSecretValue | null
    password: string
  }
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

const isEncryptedSecretValue = (
  value: unknown,
): value is EncryptedSecretValue =>
  isRecord(value) &&
  typeof value.iv === "string" &&
  typeof value.data === "string"

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

    const { connector, passwordSecretValue, password } = value
    const isWebdavCredentials =
      typeof password === "string" &&
      isWebdavConnector(connector) &&
      (passwordSecretValue === null ||
        isEncryptedSecretValue(passwordSecretValue))

    if (!isWebdavCredentials) return null

    return { connector, passwordSecretValue, password }
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

/** A connection as `list` returns it: its key, without its credentials. */
export type StoredConnection<
  P extends ConnectionProvider = ConnectionProvider,
> = ConnectionKey<P> & {
  accountName: string
  scopes: string[]
  connectedAt: Date
  updatedAt: Date
}

const toStoredConnection = <P extends ConnectionProvider>(
  { userId, provider }: ProviderKey<P>,
  connection: ProviderConnectionPostgresEntity,
): StoredConnection<P> => ({
  userId,
  provider,
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
  async list<P extends ConnectionProvider>(key: ProviderKey<P>) {
    const connections = await this.connectionPostgresService.list(key)

    return connections.map((connection) => toStoredConnection(key, connection))
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

  /**
   * Deletes the connection, as `list` returned it, only while its credentials
   * are still the ones written at its `updatedAt`.
   *
   * @returns `false` when it deleted nothing.
   */
  disconnectIfUnchanged({
    userId,
    provider,
    accountId,
    updatedAt,
  }: StoredConnection) {
    return this.connectionPostgresService.deleteIfUnchanged({
      userId,
      provider,
      accountId,
      updatedAt,
    })
  }
}
