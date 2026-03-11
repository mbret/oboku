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
    it("should generate resource ID with dummy host (host:path format)", () => {
      const result = generateWebdavResourceId({
        filename: "document.pdf",
      })
      expect(result).toBe("webdav://_:document.pdf")
    })

    it("should encode special characters in filename", () => {
      const result = generateWebdavResourceId({
        filename: "my document with spaces.pdf",
      })
      expect(result).toBe("webdav://_:my%20document%20with%20spaces.pdf")
    })

    it("should handle filenames with path and special characters", () => {
      const result = generateWebdavResourceId({
        filename: "file/with/path:and:colons.pdf",
      })
      expect(result).toBe("webdav://_:file%2Fwith%2Fpath%3Aand%3Acolons.pdf")
    })
  })

  describe("explodeWebdavResourceId", () => {
    it("should extract filename from resource ID (new format with dummy host)", () => {
      const resourceId = "webdav://_:document.pdf"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        filename: "document.pdf",
        directory: "/",
        basename: "document.pdf",
      })
    })

    it("should extract filename from old format (real host)", () => {
      const resourceId = "webdav://webdav.example.com:Books%2Ffoo.epub"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        filename: "Books/foo.epub",
        directory: "/Books",
        basename: "foo.epub",
      })
    })

    it("should decode encoded filenames", () => {
      const resourceId = "webdav://_:my%20document%20with%20spaces.pdf"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        filename: "my document with spaces.pdf",
        directory: "/",
        basename: "my document with spaces.pdf",
      })
    })

    it("should handle filenames with path and special characters", () => {
      const resourceId = "webdav://_:file%2Fwith%2Fpath%3Aand%3Acolons.pdf"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        filename: "file/with/path:and:colons.pdf",
        directory: "/file/with",
        basename: "path:and:colons.pdf",
      })
    })

    it("should normalize directory to always start with /", () => {
      const resourceId = "webdav://_:folder/subfolder/document.pdf"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        filename: "folder/subfolder/document.pdf",
        directory: "/folder/subfolder",
        basename: "document.pdf",
      })
    })

    it("should handle URLs with colons in host (old format)", () => {
      const resourceId = "webdav://[2001:db8::1]:8080:path%2Fto%2Ffile.epub"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        filename: "path/to/file.epub",
        directory: "/path/to",
        basename: "file.epub",
      })
    })

    it("should throw error for invalid resource ID format", () => {
      const invalidResourceId = "invalid://document.pdf"

      expect(() => explodeWebdavResourceId(invalidResourceId)).toThrow(
        "Invalid resource ID format",
      )
    })

    it("should throw when host:path separator is missing", () => {
      expect(() => explodeWebdavResourceId("webdav://document.pdf")).toThrow(
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
      expect(extracted.directory).toBe("/")
      expect(extracted.basename).toBe(originalData.filename)
    })

    it("should correctly extract directory and basename from path", () => {
      const originalData = {
        filename: "folder/subfolder/document.pdf",
      }

      const resourceId = generateWebdavResourceId(originalData)
      const extracted = explodeWebdavResourceId(resourceId)

      expect(extracted.filename).toBe(originalData.filename)
      expect(extracted.directory).toBe("/folder/subfolder")
      expect(extracted.basename).toBe("document.pdf")
    })
  })
})
