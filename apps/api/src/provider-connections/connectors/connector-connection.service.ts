import { isDeepStrictEqual } from "node:util"
import { BadRequestException, Injectable } from "@nestjs/common"
import { CONNECTABLE_CONNECTOR_TYPES, ObokuErrorCode } from "@oboku/shared"
import { CouchService } from "../../couch/couch.service.js"
import { fetchByIds, getSettings } from "../../couch/dbHelpers.js"
import { createObokuBadRequest } from "../../http/obokuBadRequest.js"
import { isNonPublicAddressError } from "../../http/publicAddress.js"
import { isSignInRefused, signInToWebdav } from "../../plugins/webdav/index.js"
import {
  type EncryptedSecretValue,
  ProviderConnectionsService,
} from "../provider-connections.service.js"
import type {
  ConnectorConnectionDto,
  ConnectorConnectionStatus,
} from "./connector-connection.dto.js"

const SIGN_IN_DEADLINE_MS = 10_000

const toSignInError = (error: unknown) => {
  if (isNonPublicAddressError(error)) {
    return createObokuBadRequest(ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED)
  }

  return createObokuBadRequest(
    isSignInRefused(error)
      ? ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED
      : ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE,
  )
}

type UserDb = Awaited<ReturnType<CouchService["createNanoInstanceForUser"]>>

const readConnectors = async (db: UserDb) => {
  const settings = await getSettings(db)

  return settings?.connectors ?? []
}

/** The value of each secret the user's database holds, by id. */
const readSecretValues = async (
  db: UserDb,
  secretIds: ReadonlyArray<string>,
) => {
  const secrets = await fetchByIds(db, "secret", secretIds)

  return new Map<string, EncryptedSecretValue | null>(
    secrets.map((secret) => [secret._id, secret.value ?? null]),
  )
}

const toConnectorConnection = ({
  connectorId,
  status,
  connectedAt,
}: {
  connectorId: string
  status: ConnectorConnectionStatus
  connectedAt: Date
}): ConnectorConnectionDto => ({
  connectorId,
  status,
  connectedAt: connectedAt.toISOString(),
})

/**
 * The connectors whose password a user lets the API keep. Each connection
 * keeps the connector as it was when the user connected it, and the API only
 * uses the password while the connector still matches it.
 */
@Injectable()
export class ConnectorConnectionService {
  constructor(
    private readonly couchService: CouchService,
    private readonly providerConnectionsService: ProviderConnectionsService,
  ) {}

  private async listStoredConnections(userId: number) {
    const { providerConnectionsService } = this
    const connectionsByType = await Promise.all(
      CONNECTABLE_CONNECTOR_TYPES.map(
        async function listConnectionsOfType(provider) {
          const connections = await providerConnectionsService.list({
            userId,
            provider,
          })

          return connections.map((connection) => ({ ...connection, provider }))
        },
      ),
    )

    return connectionsByType.flat()
  }

  /**
   * Signs in to the connector's server with `password`, then keeps a copy of
   * the connector and of its password secret's encrypted value, with the
   * password, encrypted. Replaces the connector's previous connection.
   */
  async connect({
    userId,
    email,
    connectorId,
    password,
  }: {
    userId: number
    email: string
    connectorId: string
    password: string
  }): Promise<ConnectorConnectionDto> {
    const db = await this.couchService.createNanoInstanceForUser({ email })
    const connectors = await readConnectors(db)
    const connector = connectors.find(({ id }) => id === connectorId)
    const secretValues = await readSecretValues(
      db,
      connector ? [connector.passwordAsSecretId] : [],
    )
    const passwordSecretValue = connector
      ? secretValues.get(connector.passwordAsSecretId)
      : undefined
    const isPasswordSecretStored = passwordSecretValue !== undefined

    if (!connector || !isPasswordSecretStored) {
      throw createObokuBadRequest(
        ObokuErrorCode.ERROR_PROVIDER_CONNECTION_CONNECTOR_NOT_FOUND,
      )
    }

    if (connector.type !== "webdav") {
      throw new BadRequestException(
        `A ${connector.type} connector cannot be connected`,
      )
    }

    try {
      await signInToWebdav({
        connector,
        password,
        signal: AbortSignal.timeout(SIGN_IN_DEADLINE_MS),
      })
    } catch (error) {
      throw toSignInError(error)
    }

    await this.providerConnectionsService.connect({
      userId,
      provider: connector.type,
      credentials: { connector, passwordSecretValue, password },
      accountId: connector.id,
      accountName: connector.url,
      scopes: [],
    })

    const storedConnections = await this.listStoredConnections(userId)
    const storedConnection = storedConnections.find(
      ({ accountId }) => accountId === connector.id,
    )

    if (!storedConnection) {
      throw new Error("The connector's connection was not kept")
    }

    return toConnectorConnection({
      connectorId: connector.id,
      status: "connected",
      connectedAt: storedConnection.connectedAt,
    })
  }

  /**
   * The user's connector connections. A connection whose connector or
   * password secret no longer exists, or whose credentials no longer decrypt,
   * is deleted.
   */
  async list({
    userId,
    email,
  }: {
    userId: number
    email: string
  }): Promise<ConnectorConnectionDto[]> {
    const storedConnections = await this.listStoredConnections(userId)

    if (storedConnections.length === 0) return []

    const { providerConnectionsService } = this
    const db = await this.couchService.createNanoInstanceForUser({ email })
    const connectors = await readConnectors(db)
    const secretValues = await readSecretValues(
      db,
      connectors.map(({ passwordAsSecretId }) => passwordAsSecretId),
    )
    const connections = await Promise.all(
      storedConnections.map(async function toCurrentConnection({
        provider,
        accountId: connectorId,
        connectedAt,
      }) {
        const key = { userId, provider, accountId: connectorId }
        const credentials = await providerConnectionsService.getCredentials(key)
        const connector = connectors.find(
          ({ id, type }) => id === connectorId && type === provider,
        )
        const passwordSecretValue = connector
          ? secretValues.get(connector.passwordAsSecretId)
          : undefined
        const isPasswordSecretStored = passwordSecretValue !== undefined

        if (!credentials || !connector || !isPasswordSecretStored) {
          await providerConnectionsService.disconnect(key)

          return null
        }

        const isUnchangedSinceConnected =
          isDeepStrictEqual(credentials.connector, connector) &&
          isDeepStrictEqual(
            credentials.passwordSecretValue,
            passwordSecretValue,
          )

        return toConnectorConnection({
          connectorId,
          status: isUnchangedSinceConnected ? "connected" : "connector-changed",
          connectedAt,
        })
      }),
    )

    return connections.filter((connection) => connection !== null)
  }

  async disconnect({
    userId,
    connectorId,
  }: {
    userId: number
    connectorId: string
  }) {
    await Promise.all(
      CONNECTABLE_CONNECTOR_TYPES.map((provider) =>
        this.providerConnectionsService.disconnect({
          userId,
          provider,
          accountId: connectorId,
        }),
      ),
    )
  }
}
