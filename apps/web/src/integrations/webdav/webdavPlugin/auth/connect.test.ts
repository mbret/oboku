import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function stubFetchBeforeWebdavBindsIt() {
  const fetch = vi.fn<typeof globalThis.fetch>()
  vi.stubGlobal("fetch", fetch)

  return { fetch }
})

import { listDirectoryFromWebdavServer } from "../listDirectory"
import { createWebdavClient } from "./connect"

const DAV_URL = "https://dav.example.test/books"
const USERNAME = "reader"
const PASSWORD = "webdav-password-1234"
const WRONG_PASSWORD = "not-the-webdav-password"

const BOOKS_LISTING = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/books/</d:href>
    <d:propstat>
      <d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
  <d:response>
    <d:href>/books/book.epub</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype/>
        <d:getcontentlength>1024</d:getcontentlength>
        <d:getcontenttype>application/epub+zip</d:getcontenttype>
        <d:getlastmodified>Thu, 01 Jan 2026 00:00:00 GMT</d:getlastmodified>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`

type FakeServer = {
  scheme: string
  challenge: string
  isAuthorizedWithPassword: (authorization: string | null) => boolean
}

const basicServer: FakeServer = {
  scheme: "Basic",
  challenge: 'Basic realm="nas"',
  isAuthorizedWithPassword: function isBasicAuthWithPassword(authorization) {
    return authorization === `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`
  },
}

const digestServer: FakeServer = {
  scheme: "Digest",
  challenge:
    'Digest realm="nas", nonce="5ccc069c403ebaf9f0171e9517f40e41", qop="auth"',
  isAuthorizedWithPassword: function isDigestAuthOfUser(authorization) {
    return authorization?.startsWith(`Digest username="${USERNAME}"`) ?? false
  },
}

const answerUnauthorized = ({ challenge }: FakeServer) =>
  new Response("<html><body>401 Unauthorized</body></html>", {
    status: 401,
    headers: { "WWW-Authenticate": challenge },
  })

const answerAsServerThatAcceptsThePassword = (server: FakeServer) =>
  mocks.fetch.mockImplementation(
    async function answerListingToAuthorizedRequest(_url, init) {
      const authorization = new Headers(init?.headers).get("authorization")

      if (!server.isAuthorizedWithPassword(authorization)) {
        return answerUnauthorized(server)
      }

      return new Response(BOOKS_LISTING, {
        status: 207,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      })
    },
  )

const answerAsServerThatRefusesThePassword = (server: FakeServer) =>
  mocks.fetch.mockImplementation(async function refusePassword() {
    return answerUnauthorized(server)
  })

describe.each([basicServer, digestServer])(
  "WebDAV client, on a server that only accepts $scheme auth",
  (server) => {
    it("lists a folder when the server accepts the password", async () => {
      answerAsServerThatAcceptsThePassword(server)

      const items = await listDirectoryFromWebdavServer({
        client: createWebdavClient({
          url: DAV_URL,
          username: USERNAME,
          password: PASSWORD,
        }),
        path: "/",
      })

      expect(items).toEqual([
        expect.objectContaining({ basename: "book.epub", type: "file" }),
      ])
    })

    it("rejects a folder listing with a 401 when the server refuses the password", async () => {
      answerAsServerThatRefusesThePassword(server)

      await expect(
        listDirectoryFromWebdavServer({
          client: createWebdavClient({
            url: DAV_URL,
            username: USERNAME,
            password: WRONG_PASSWORD,
          }),
          path: "/",
        }),
      ).rejects.toMatchObject({ status: 401 })
    })

    it("rejects a book download with a 401 when the server refuses the password", async () => {
      answerAsServerThatRefusesThePassword(server)
      const client = createWebdavClient({
        url: DAV_URL,
        username: USERNAME,
        password: WRONG_PASSWORD,
      })

      await expect(
        client.getFileContents("/book.epub", { format: "binary" }),
      ).rejects.toMatchObject({ status: 401 })
    })
  },
)
