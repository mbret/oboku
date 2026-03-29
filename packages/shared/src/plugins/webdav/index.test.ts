import { describe, it, expect } from "vitest"
import { normalizeWebdavBaseUrl } from "./index"

describe("WebDAV Plugin", () => {
  describe("normalizeWebdavBaseUrl", () => {
    it("normalizes trailing slashes and strips search params and hash", () => {
      expect(
        normalizeWebdavBaseUrl("https://webdav.example.com/dav/?foo=bar#hash"),
      ).toBe("https://webdav.example.com/dav")
    })
  })
})
