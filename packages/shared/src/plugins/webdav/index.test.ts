import { describe, it, expect } from "vitest"
import {
  generateWebdavResourceId,
  explodeWebdavResourceId,
  normalizeWebdavBaseUrl,
} from "./index"

describe("WebDAV Plugin", () => {
  describe("normalizeWebdavBaseUrl", () => {
    it("normalizes trailing slashes and strips search params and hash", () => {
      expect(
        normalizeWebdavBaseUrl("https://webdav.example.com/dav/?foo=bar#hash"),
      ).toBe("https://webdav.example.com/dav")
    })
  })

  describe("generateWebdavResourceId", () => {
    it("should generate resource ID without dummy host", () => {
      const result = generateWebdavResourceId({
        filename: "document.pdf",
      })
      expect(result).toBe("webdav://document.pdf")
    })

    it("should encode special characters in filename", () => {
      const result = generateWebdavResourceId({
        filename: "my document with spaces.pdf",
      })
      expect(result).toBe("webdav://my%20document%20with%20spaces.pdf")
    })

    it("should handle filenames with path and special characters", () => {
      const result = generateWebdavResourceId({
        filename: "file/with/path:and:colons.pdf",
      })
      expect(result).toBe("webdav://file%2Fwith%2Fpath%3Aand%3Acolons.pdf")
    })
  })

  describe("explodeWebdavResourceId", () => {
    it("should extract filename from canonical resource ID format", () => {
      const resourceId = "webdav://document.pdf"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        filename: "document.pdf",
      })
    })

    it("should throw for old format with real host", () => {
      const resourceId = "webdav://webdav.example.com:Books%2Ffoo.epub"

      expect(() => explodeWebdavResourceId(resourceId)).toThrow(
        "Invalid resource ID format",
      )
    })

    it("should decode encoded filenames", () => {
      const resourceId = "webdav://my%20document%20with%20spaces.pdf"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        filename: "my document with spaces.pdf",
      })
    })

    it("should handle filenames with path and special characters", () => {
      const resourceId = "webdav://file%2Fwith%2Fpath%3Aand%3Acolons.pdf"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        filename: "file/with/path:and:colons.pdf",
      })
    })

    it("should handle URLs with colons in host (old format)", () => {
      const resourceId = "webdav://[2001:db8::1]:8080:path%2Fto%2Ffile.epub"

      expect(() => explodeWebdavResourceId(resourceId)).toThrow(
        "Invalid resource ID format",
      )
    })

    it("should throw error for invalid resource ID format", () => {
      const invalidResourceId = "invalid://document.pdf"

      expect(() => explodeWebdavResourceId(invalidResourceId)).toThrow(
        "Invalid resource ID format",
      )
    })

    it("should throw for legacy host-based format", () => {
      expect(() => explodeWebdavResourceId("webdav://_:document.pdf")).toThrow(
        "Invalid resource ID format",
      )
    })
  })

  describe("Integration between generate and explode", () => {
    it("should generate and explode resource IDs correctly", () => {
      const originalData = {
        filename: "my document with spaces and special chars: like this.pdf",
      }

      const resourceId = generateWebdavResourceId(originalData)
      const extracted = explodeWebdavResourceId(resourceId)

      expect(extracted.filename).toBe(originalData.filename)
    })

    it("should preserve path information inside filename", () => {
      const originalData = {
        filename: "folder/subfolder/document.pdf",
      }

      const resourceId = generateWebdavResourceId(originalData)
      const extracted = explodeWebdavResourceId(resourceId)

      expect(extracted.filename).toBe(originalData.filename)
    })
  })
})
