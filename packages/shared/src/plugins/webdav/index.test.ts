import { describe, it, expect } from "vitest"
import { generateWebdavResourceId, explodeWebdavResourceId } from "./index"

describe("WebDAV Plugin", () => {
  describe("generateWebdavResourceId", () => {
    it("should generate correct resource ID from URL and filename", () => {
      const data = {
        url: "https://webdav.example.com",
        filename: "document.pdf",
      }

      const result = generateWebdavResourceId(data)
      expect(result).toBe("webdav://webdav.example.com:document.pdf")
    })

    it("should encode special characters in filename", () => {
      const data = {
        url: "https://webdav.example.com",
        filename: "my document with spaces.pdf",
      }

      const result = generateWebdavResourceId(data)
      expect(result).toBe(
        "webdav://webdav.example.com:my%20document%20with%20spaces.pdf",
      )
    })

    it("should handle filenames with special characters", () => {
      const data = {
        url: "https://webdav.example.com",
        filename: "file/with/path:and:colons.pdf",
      }

      const result = generateWebdavResourceId(data)
      expect(result).toBe(
        "webdav://webdav.example.com:file%2Fwith%2Fpath%3Aand%3Acolons.pdf",
      )
    })
  })

  describe("explodeWebdavResourceId", () => {
    it("should extract URL and filename from resource ID", () => {
      const resourceId = "webdav://webdav.example.com:document.pdf"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        url: "webdav.example.com",
        filename: "document.pdf",
        directory: "/",
        basename: "document.pdf",
      })
    })

    it("should decode encoded filenames", () => {
      const resourceId =
        "webdav://webdav.example.com:my%20document%20with%20spaces.pdf"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        url: "webdav.example.com",
        filename: "my document with spaces.pdf",
        directory: "/",
        basename: "my document with spaces.pdf",
      })
    })

    it("should handle filenames with special characters", () => {
      const resourceId =
        "webdav://webdav.example.com:file%2Fwith%2Fpath%3Aand%3Acolons.pdf"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        url: "webdav.example.com",
        filename: "file/with/path:and:colons.pdf",
        directory: "/file/with",
        basename: "path:and:colons.pdf",
      })
    })

    it("should normalize directory to always start with /", () => {
      const resourceId = "webdav://webdav.example.com:folder/subfolder/document.pdf"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        url: "webdav.example.com",
        filename: "folder/subfolder/document.pdf",
        directory: "/folder/subfolder",
        basename: "document.pdf",
      })
    })

    it("should handle URLs with colons", () => {
      const resourceId = "webdav://[2001:db8::1]:8080:document.pdf"

      const result = explodeWebdavResourceId(resourceId)
      expect(result).toEqual({
        url: "[2001:db8::1]:8080",
        filename: "document.pdf",
        directory: "/",
        basename: "document.pdf",
      })
    })

    it("should throw error for invalid resource ID format", () => {
      const invalidResourceId = "invalid://webdav.example.com:document.pdf"

      expect(() => explodeWebdavResourceId(invalidResourceId)).toThrow(
        "Invalid resource ID format",
      )
    })

    it("should throw error for resource ID without colon", () => {
      const invalidResourceId = "webdav://webdav.example.com"

      expect(() => explodeWebdavResourceId(invalidResourceId)).toThrow(
        "Invalid resource ID format",
      )
    })
  })

  describe("Integration between generate and explode", () => {
    it("should generate and explode resource IDs correctly", () => {
      const originalData = {
        url: "https://webdav.example.com",
        filename: "my document with spaces and special chars: like this.pdf",
      }

      const resourceId = generateWebdavResourceId(originalData)
      const extracted = explodeWebdavResourceId(resourceId)

      expect(extracted.url).toBe("webdav.example.com")
      expect(extracted.filename).toBe(originalData.filename)
      expect(extracted.directory).toBe("/")
      expect(extracted.basename).toBe(originalData.filename)
    })

    it("should correctly extract directory and basename from path", () => {
      const originalData = {
        url: "https://webdav.example.com",
        filename: "folder/subfolder/document.pdf",
      }

      const resourceId = generateWebdavResourceId(originalData)
      const extracted = explodeWebdavResourceId(resourceId)

      expect(extracted.url).toBe("webdav.example.com")
      expect(extracted.filename).toBe(originalData.filename)
      expect(extracted.directory).toBe("/folder/subfolder")
      expect(extracted.basename).toBe("document.pdf")
    })
  })
})
