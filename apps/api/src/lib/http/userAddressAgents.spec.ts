import axios from "axios"
import { createServer, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import { createClient } from "webdav"
import { isNonPublicAddressError } from "./publicAddress.js"
import {
  getUserAddressRequestOptions,
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

describe("getUserAddressRequestOptions", () => {
  let server: Server
  let port: number

  const getError = (request: Promise<unknown>) =>
    request.then(
      () => undefined,
      (error: unknown) => error,
    )

  beforeEach(async () => {
    server = createServer((_req, res) => {
      res.writeHead(200, { "content-type": "text/plain" })
      res.end("ok")
    })
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))

    const address = server.address()

    if (!isPortAddress(address)) throw new Error("Not listening on a port")

    port = address.port
  })

  afterEach(async () => {
    setPrivateNetworkRequestsAllowed(false)
    vi.unstubAllEnvs()
    await new Promise((resolve) => server.close(resolve))
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
})
