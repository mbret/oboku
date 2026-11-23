import { describe, expect, it } from "vitest"
import { parseLegacyResourceIdForMigration } from "./legacyResourceId"

describe("parseLegacyResourceIdForMigration", () => {
  describe("types without identity fields", () => {
    it("returns undefined for the file type", () => {
      expect(
        parseLegacyResourceIdForMigration("file", "anything"),
      ).toBeUndefined()
    })

    it("returns undefined for an unrecognized type", () => {
      expect(
        parseLegacyResourceIdForMigration("unknown-plugin", "some-id"),
      ).toBeUndefined()
    })

    it("returns undefined for an empty type", () => {
      expect(parseLegacyResourceIdForMigration("", "drive-abc")).toBeUndefined()
    })
  })

  describe("DRIVE type", () => {
    it("strips the drive- prefix", () => {
      expect(
        parseLegacyResourceIdForMigration("DRIVE", "drive-abc123"),
      ).toEqual({ fileId: "abc123" })
    })

    it("leaves the value intact when the prefix is missing", () => {
      expect(parseLegacyResourceIdForMigration("DRIVE", "abc123")).toEqual({
        fileId: "abc123",
      })
    })

    it("does not strip a mid-string occurrence of the prefix token", () => {
      expect(
        parseLegacyResourceIdForMigration("DRIVE", "foo-drive-bar"),
      ).toEqual({ fileId: "foo-drive-bar" })
    })

    it("does not decode the value", () => {
      expect(parseLegacyResourceIdForMigration("DRIVE", "drive-a%20b")).toEqual(
        { fileId: "a%20b" },
      )
    })

    it("keeps an empty resourceId as an empty fileId", () => {
      expect(parseLegacyResourceIdForMigration("DRIVE", "")).toEqual({
        fileId: "",
      })
    })
  })

  describe("dropbox type", () => {
    it("strips the dropbox- prefix", () => {
      expect(
        parseLegacyResourceIdForMigration("dropbox", "dropbox-file42"),
      ).toEqual({ fileId: "file42" })
    })

    it("leaves the value intact when the prefix is missing", () => {
      expect(parseLegacyResourceIdForMigration("dropbox", "file42")).toEqual({
        fileId: "file42",
      })
    })

    it("does not strip a mid-string occurrence of the prefix token", () => {
      expect(
        parseLegacyResourceIdForMigration("dropbox", "my-dropbox-file"),
      ).toEqual({ fileId: "my-dropbox-file" })
    })
  })

  describe("webdav type", () => {
    it("strips the webdav:// prefix and decodes", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "webdav",
          "webdav://path%2Fto%2Ffile.epub",
        ),
      ).toEqual({ filePath: "path/to/file.epub" })
    })

    it("handles missing prefix", () => {
      expect(
        parseLegacyResourceIdForMigration("webdav", "path/to/file.epub"),
      ).toEqual({ filePath: "path/to/file.epub" })
    })

    it("decodes only once", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "webdav",
          "webdav://path%252Fencoded",
        ),
      ).toEqual({ filePath: "path%2Fencoded" })
    })

    it("keeps invalid percent sequences as they are", () => {
      expect(
        parseLegacyResourceIdForMigration("webdav", "webdav://%ZZbad"),
      ).toEqual({ filePath: "%ZZbad" })
    })

    it("strips the host from the legacy host-based format", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "webdav",
          "webdav://myhost:path%2Fto%2Ffile.epub",
        ),
      ).toEqual({ filePath: "path/to/file.epub" })
    })

    it("strips the host and port from the legacy host-based format", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "webdav",
          "webdav://myhost:8080:path%2Fto%2Ffile.epub",
        ),
      ).toEqual({ filePath: "path/to/file.epub" })
    })

    it("strips the dummy host from the legacy _: format", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "webdav",
          "webdav://_:path%2Fto%2Ffile.epub",
        ),
      ).toEqual({ filePath: "path/to/file.epub" })
    })
  })

  describe("synology-drive type", () => {
    it("strips the synology-drive:// prefix", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "synology-drive",
          "synology-drive://123456",
        ),
      ).toEqual({ fileId: "123456" })
    })

    it("handles missing prefix", () => {
      expect(
        parseLegacyResourceIdForMigration("synology-drive", "123456"),
      ).toEqual({ fileId: "123456" })
    })

    it("decodes URI-encoded values", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "synology-drive",
          "synology-drive://my%20file",
        ),
      ).toEqual({ fileId: "my file" })
    })

    it("decodes only once", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "synology-drive",
          "synology-drive://id%2520encoded",
        ),
      ).toEqual({ fileId: "id%20encoded" })
    })

    it("keeps invalid percent sequences as they are", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "synology-drive",
          "synology-drive://%ZZbad",
        ),
      ).toEqual({ fileId: "%ZZbad" })
    })
  })

  describe("server type", () => {
    it("strips the server:// prefix and decodes", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "server",
          "server://uploads%2Fbook.epub",
        ),
      ).toEqual({ filePath: "uploads/book.epub" })
    })

    it("handles missing prefix", () => {
      expect(
        parseLegacyResourceIdForMigration("server", "uploads/book.epub"),
      ).toEqual({ filePath: "uploads/book.epub" })
    })

    it("keeps invalid percent sequences as they are", () => {
      expect(
        parseLegacyResourceIdForMigration("server", "server://%ZZbad"),
      ).toEqual({ filePath: "%ZZbad" })
    })
  })

  describe("URI type", () => {
    it("strips the oboku-link- prefix", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "URI",
          "oboku-link-https://example.com/book.epub",
        ),
      ).toEqual({ url: "https://example.com/book.epub" })
    })

    it("leaves the value intact when the prefix is missing", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "URI",
          "https://example.com/book.epub",
        ),
      ).toEqual({ url: "https://example.com/book.epub" })
    })

    it("does not strip a mid-string occurrence of the prefix token", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "URI",
          "https://example.com/oboku-link-book.epub",
        ),
      ).toEqual({ url: "https://example.com/oboku-link-book.epub" })
    })

    it("does not decode the value", () => {
      expect(
        parseLegacyResourceIdForMigration(
          "URI",
          "oboku-link-https://example.com/my%20book.epub",
        ),
      ).toEqual({ url: "https://example.com/my%20book.epub" })
    })
  })
})
