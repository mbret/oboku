import { once } from "node:events"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { setPrivateNetworkAllowedHosts } from "../../http/userAddressAgents.js"
import type { OpdsConnector } from "./client.js"

const username = "reader"
export const password = "opds-password-1234"
export const basicAuthorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`

type Route = {
  status?: number
  headers?: Record<string, string>
  body?: string
}

type ReceivedRequest = {
  path: string | undefined
  authorization: string | undefined
}

const isPortAddress = (
  address: string | AddressInfo | null,
): address is AddressInfo => typeof address === "object" && address !== null

export async function startServer(routes: Record<string, Route>) {
  const onRequest = vi.fn<(request: ReceivedRequest) => void>()
  const server = createServer(function answerFromRoutes(request, response) {
    onRequest({
      path: request.url,
      authorization: request.headers.authorization,
    })

    const route = routes[request.url ?? ""]

    if (!route) {
      response.writeHead(404)
      response.end()

      return
    }

    response.writeHead(route.status ?? 200, {
      "content-type": "application/atom+xml;charset=utf-8",
      ...route.headers,
    })
    response.end(route.body)
  }).listen(0, "127.0.0.1")

  onTestFinished(async function closeServer() {
    server.close()
    await once(server, "close")
  })

  await once(server, "listening")

  const address = server.address()

  if (!isPortAddress(address)) throw new Error("Not listening on a port")

  const host = `127.0.0.1:${address.port}`

  return { host, origin: `http://${host}`, onRequest }
}

export const allowServers = (...servers: { host: string }[]) =>
  setPrivateNetworkAllowedHosts(servers.map(({ host }) => host))

export const forgetAllowedServers = () => setPrivateNetworkAllowedHosts([])

export type ConnectorOptions = {
  connectorUrl: string
  allowSelfSigned?: boolean
}

export const connectorFor = ({
  connectorUrl,
  allowSelfSigned,
}: ConnectorOptions): OpdsConnector => ({
  id: "connector",
  type: "opds",
  url: connectorUrl,
  username,
  password,
  allowSelfSigned,
})
