import { isDeepStrictEqual } from "node:util"
import { BadRequestException, Injectable } from "@nestjs/common"
import { ObokuErrorCode } from "@oboku/shared"
import { CouchService } from "../../couch/couch.service.js"
import { getSettings } from "../../couch/dbHelpers.js"
import { isRecord } from "../../http/isRecord.js"
import { createObokuBadRequest } from "../../http/obokuBadRequest.js"
import { isNonPublicAddressError } from "../../http/publicAddress.js"
import { signInToWebdav } from "../../plugins/webdav/index.js"
import {
  type ConnectionProvider,
  ProviderConnectionsService,
} from "../provider-connections.service.js"
import type {
  ConnectorConnectionDto,
  ConnectorConnectionStatus,
} from "./connector-connection.dto.js"

/** The connector types whose server the API can sign in to. */
const CONNECTABLE_CONNECTOR_TYPES = ["webdav"] satisfies ConnectionProvider[]

const SIGN_IN_DEADLINE_MS = 10_000

const UNAUTHORIZED_STATUSES = [401, 403]

/** The status a server answered with, which WebDAV client errors carry. */
const toAnsweredStatus = (error: unknown) =>
  isRecord(error) && typeof error.status === "number" ? error.status : null

const toSignInError = (error: unknown) => {
  if (isNonPublicAddressError(error)) {
    return createObokuBadRequest(ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED)
  }

  const answeredStatus = toAnsweredStatus(error)
  const isSignInRefused =
    answeredStatus !== null && UNAUTHORIZED_STATUSES.includes(answeredStatus)

  return createObokuBadRequest(
    isSignInRefused
      ? ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SIGN_IN_REFUSED
      : ObokuErrorCode.ERROR_PROVIDER_CONNECTION_SERVER_UNREACHABLE,
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

  private async readConnectors(email: string) {
    const db = await this.couchService.createNanoInstanceForUser({ email })
    const settings = await getSettings(db)

    return settings?.connectors ?? []
  }

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
   * the connector with the password, encrypted. Replaces the connector's
   * previous connection.
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
    const connectors = await this.readConnectors(email)
    const connector = connectors.find(({ id }) => id === connectorId)

    if (!connector) {
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
      credentials: { connector, password },
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
   * The user's connector connections. A connection whose connector no longer
   * exists, or whose credentials no longer decrypt, is deleted.
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
    const connectors = await this.readConnectors(email)
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

        if (!credentials || !connector) {
          await providerConnectionsService.disconnect(key)

          return null
        }

        const isConnectorUnchanged = isDeepStrictEqual(
          credentials.connector,
          connector,
        )

        return toConnectorConnection({
          connectorId,
          status: isConnectorUnchanged ? "connected" : "connector-changed",
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
