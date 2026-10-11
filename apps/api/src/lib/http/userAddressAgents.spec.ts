import axios from "axios"
import { createServer, type RequestListener, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import { createClient } from "webdav"
import { isNonPublicAddressError } from "./publicAddress.js"
import {
  getUserAddressRequestOptions,
  setApiAddresses,
  setPrivateNetworkAllowedHosts,
  setPrivateNetworkRequestsAllowed,
} from "./userAddressAgents.js"

const PROXY_VARIABLES = [
  "http_proxy",
  "HTTP_PROXY",
  "https_proxy",
  "HTTPS_PROXY",
]
const NO_PROXY_VARIABLES = ["no_proxy", "NO_PROXY"]

const isPortAddress = (
  address: string | AddressInfo | null,
): address is AddressInfo => typeof address === "object" && address !== null

const startServer = async (listener: RequestListener) => {
  const server = createServer(listener)

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))

  const address = server.address()

  if (!isPortAddress(address)) throw new Error("Not listening on a port")

  return { server, port: address.port }
}

const closeServer = (server: Server) =>
  new Promise((resolve) => server.close(resolve))

describe("getUserAddressRequestOptions", () => {
  let server: Server
  let port: number

  const getError = (request: Promise<unknown>) =>
    request.then(
      () => undefined,
      (error: unknown) => error,
    )

  beforeEach(async () => {
    ;({ server, port } = await startServer(function answerOk(_req, res) {
      res.writeHead(200, { "content-type": "text/plain" })
      res.end("ok")
    }))
  })

  afterEach(async () => {
    setPrivateNetworkRequestsAllowed(false)
    setPrivateNetworkAllowedHosts([])
    setApiAddresses({ publicUrls: [], port: 0 })
    vi.unstubAllEnvs()
    await closeServer(server)
  })

  it("refuses an address on a private network", async () => {
    const error = await getError(
      axios.get(`http://127.0.0.1:${port}/`, getUserAddressRequestOptions()),
    )

    expect(isNonPublicAddressError(error)).toBe(true)
  })

  it("refuses a host name that resolves to a private network", async () => {
    const error = await getError(
      axios.get(`http://localhost:${port}/`, getUserAddressRequestOptions()),
    )

    expect(isNonPublicAddressError(error)).toBe(true)
  })

  it("refuses HTTPS requests, self-signed or not", async () => {
    const errors = await Promise.all(
      [false, true].map((allowSelfSigned) =>
        getError(
          axios.get(
            `https://127.0.0.1:${port}/`,
            getUserAddressRequestOptions({ allowSelfSigned }),
          ),
        ),
      ),
    )

    expect(errors.map(isNonPublicAddressError)).toEqual([true, true])
  })

  it("checks the server itself when a proxy is configured", async () => {
    for (const name of PROXY_VARIABLES) {
      vi.stubEnv(name, "http://proxy.invalid:3128")
    }
    for (const name of NO_PROXY_VARIABLES) {
      vi.stubEnv(name, "")
    }

    const errors = await Promise.all(
      ["http", "https"].map((protocol) =>
        getError(
          axios.get(
            `${protocol}://127.0.0.1:${port}/`,
            getUserAddressRequestOptions(),
          ),
        ),
      ),
    )

    expect(errors.map(isNonPublicAddressError)).toEqual([true, true])
  })

  it("refuses the requests of the webdav client", async () => {
    const error = await getError(
      createClient(
        `http://127.0.0.1:${port}`,
        getUserAddressRequestOptions(),
      ).getDirectoryContents("/"),
    )

    expect(isNonPublicAddressError(error)).toBe(true)
  })

  it("reaches private networks once the instance allows them", async () => {
    setPrivateNetworkRequestsAllowed(true)

    const response = await axios.get(
      `http://127.0.0.1:${port}/`,
      getUserAddressRequestOptions(),
    )

    expect(response.data).toBe("ok")
  })

  it("reaches a host the instance allows, on the port it allows", async () => {
    setPrivateNetworkAllowedHosts([`127.0.0.1:${port}`])

    const response = await axios.get(
      `http://127.0.0.1:${port}/`,
      getUserAddressRequestOptions(),
    )

    expect(response.data).toBe("ok")
  })

  it("refuses the other ports of an allowed host", async () => {
    setPrivateNetworkAllowedHosts([`127.0.0.1:${port + 1}`])

    const error = await getError(
      axios.get(`http://127.0.0.1:${port}/`, getUserAddressRequestOptions()),
    )

    expect(isNonPublicAddressError(error)).toBe(true)
  })

  it("reaches every port of a host allowed without one", async () => {
    setPrivateNetworkAllowedHosts(["127.0.0.1"])

    const response = await axios.get(
      `http://127.0.0.1:${port}/`,
      getUserAddressRequestOptions(),
    )

    expect(response.data).toBe("ok")
  })

  it("checks a redirect from an allowed host again", async () => {
    const redirecting = await startServer(function redirectToServer(_req, res) {
      res.writeHead(302, { location: `http://127.0.0.1:${port}/` })
      res.end()
    })
    setPrivateNetworkAllowedHosts([`127.0.0.1:${redirecting.port}`])

    try {
      const error = await getError(
        axios.get(
          `http://127.0.0.1:${redirecting.port}/`,
          getUserAddressRequestOptions(),
        ),
      )

      expect(isNonPublicAddressError(error)).toBe(true)
    } finally {
      await closeServer(redirecting.server)
    }
  })

  it("reaches the API itself on its port", async () => {
    setApiAddresses({ publicUrls: [], port })

    const response = await axios.get(
      `http://127.0.0.1:${port}/`,
      getUserAddressRequestOptions(),
    )

    expect(response.data).toBe("ok")
  })

  it("reaches the API at the URL the web app reaches it at", async () => {
    setApiAddresses({ publicUrls: [`http://127.0.0.1:${port}/`], port: 1 })

    const response = await axios.get(
      `http://127.0.0.1:${port}/`,
      getUserAddressRequestOptions(),
    )

    expect(response.data).toBe("ok")
  })
})
