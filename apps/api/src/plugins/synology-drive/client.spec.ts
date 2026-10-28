import type { SynologyDriveSession } from "@oboku/synology"
import { once } from "node:events"
import {
  createServer,
  type IncomingMessage,
  type RequestListener,
  type Server,
  type ServerResponse,
} from "node:http"
import type { AddressInfo } from "node:net"
import { text } from "node:stream/consumers"
import { inspect } from "node:util"
import { isNonPublicAddressError } from "../../http/publicAddress.js"
import { setPrivateNetworkRequestsAllowed } from "../../http/userAddressAgents.js"
import { downloadSynologyDriveStream, signInSynologyDrive } from "./client.js"

const password = "dsm-password-1234"
const otpCode = "dsm-otp-code-5678"
const sid = "dsm-session-id-9012"

function abortResponseBody(
  _request: IncomingMessage,
  response: ServerResponse,
) {
  response.writeHead(200, { "content-length": "64" })
  response.write("{", function destroySocketMidBody() {
    response.socket?.destroy()
  })
}

function redirectToInvalidUrl(
  _request: IncomingMessage,
  response: ServerResponse,
) {
  response.writeHead(302, { location: "http://invalid host/" })
  response.end()
}

const isPortAddress = (
  address: string | AddressInfo | null,
): address is AddressInfo => typeof address === "object" && address !== null

async function getError(operation: Promise<unknown>) {
  try {
    await operation
  } catch (error) {
    return error
  }
}

async function readDownloadedFile(session: SynologyDriveSession) {
  const { stream } = await downloadSynologyDriveStream({
    fileId: "42",
    session,
  })

  return text(stream)
}

const printInFull = (error: unknown) =>
  inspect(error, { depth: Number.POSITIVE_INFINITY })

describe("signInSynologyDrive", () => {
  it("keeps the password out of the error of a refused sign-in", async () => {
    const error = await getError(
      signInSynologyDrive({
        baseUrl: "https://127.0.0.1:5001",
        username: "alice",
        password,
      }),
    )

    expect(isNonPublicAddressError(error)).toBe(true)
    expect(printInFull(error)).not.toContain(password)
  })
})

describe("with a NAS on a private network", () => {
  let server: Server

  async function serve(handler: RequestListener) {
    server = createServer(handler).listen(0, "127.0.0.1")
    await once(server, "listening")

    const address = server.address()

    if (!isPortAddress(address)) throw new Error("Not listening on a port")

    return `http://127.0.0.1:${address.port}`
  }

  beforeEach(() => {
    setPrivateNetworkRequestsAllowed(true)
  })

  afterEach(async () => {
    setPrivateNetworkRequestsAllowed(false)
    server.close()
    await once(server, "close")
  })

  describe("signInSynologyDrive", () => {
    it.each([
      {
        failure: "the response body fails",
        handler: abortResponseBody,
        code: "ERR_BAD_RESPONSE",
      },
      {
        failure: "a redirect leads to an invalid URL",
        handler: redirectToInvalidUrl,
        code: "ERR_FR_REDIRECTION_FAILURE",
      },
    ])(
      "keeps the password and OTP code out of the error when $failure",
      async ({ handler, code }) => {
        const baseUrl = await serve(handler)

        const error = await getError(
          signInSynologyDrive({
            baseUrl,
            username: "alice",
            password,
            otpCode,
          }),
        )
        const printedError = printInFull(error)

        expect(printedError).not.toContain(password)
        expect(printedError).not.toContain(otpCode)
        expect(error).toHaveProperty("code", code)
      },
    )
  })

  describe("downloadSynologyDriveStream", () => {
    it.each([
      {
        failure: "the response body fails",
        handler: abortResponseBody,
        code: "ECONNRESET",
      },
      {
        failure: "a redirect leads to an invalid URL",
        handler: redirectToInvalidUrl,
        code: "ERR_FR_REDIRECTION_FAILURE",
      },
    ])(
      "keeps the session id out of the error when $failure",
      async ({ handler, code }) => {
        const baseUrl = await serve(handler)

        const error = await getError(
          readDownloadedFile({
            auth: { baseUrl, username: "alice", password },
            sid,
          }),
        )

        expect(printInFull(error)).not.toContain(sid)
        expect(error).toHaveProperty("code", code)
      },
    )
  })
})
