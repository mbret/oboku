import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function stubFetchBeforeWebdavBindsIt() {
  const fetch = vi.fn<typeof globalThis.fetch>()
  vi.stubGlobal("fetch", fetch)

  return { fetch }
})

import { connectWebdav, createWebdavClient } from "./connect"

const DAV_URL = "https://dav.example.test/books"
const USERNAME = "reader"
const WRONG_PASSWORD = "not-the-webdav-password"

type PasswordRefusingServer = { scheme: string; challenge: string }

const basicServer: PasswordRefusingServer = {
  scheme: "Basic",
  challenge: 'Basic realm="nas"',
}

const digestServer: PasswordRefusingServer = {
  scheme: "Digest",
  challenge:
    'Digest realm="nas", nonce="5ccc069c403ebaf9f0171e9517f40e41", qop="auth"',
}

const answerAsServer = ({ challenge }: PasswordRefusingServer) =>
  mocks.fetch.mockImplementation(async function refusePassword() {
    return new Response("<html><body>401 Unauthorized</body></html>", {
      status: 401,
      headers: { "WWW-Authenticate": challenge },
    })
  })

describe("WebDAV client, when the server refuses the password", () => {
  it.each([basicServer, digestServer])(
    "rejects a folder listing with a 401 from a server that only accepts $scheme auth",
    async (server) => {
      answerAsServer(server)

      await expect(
        connectWebdav({
          url: DAV_URL,
          username: USERNAME,
          password: WRONG_PASSWORD,
        }),
      ).rejects.toMatchObject({ status: 401 })
    },
  )

  it.each([basicServer, digestServer])(
    "rejects a book download with a 401 from a server that only accepts $scheme auth",
    async (server) => {
      answerAsServer(server)
      const client = createWebdavClient({
        url: DAV_URL,
        username: USERNAME,
        password: WRONG_PASSWORD,
      })

      await expect(
        client.getFileContents("/book.epub", { format: "binary" }),
      ).rejects.toMatchObject({ status: 401 })
    },
  )
})
