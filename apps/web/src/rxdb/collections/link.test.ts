import { describe, expect, it } from "vitest"
import { migrateResourceIdToData } from "./utils"

describe("migrateResourceIdToData", () => {
  describe("when resourceId is missing or empty", () => {
    it("returns existing data unchanged when resourceId is undefined", () => {
      const existing = { foo: "bar" }
      expect(migrateResourceIdToData("DRIVE", undefined, existing)).toEqual(
        existing,
      )
    })

    it("returns existing data unchanged when resourceId is empty string", () => {
      const existing = { foo: "bar" }
      expect(migrateResourceIdToData("DRIVE", "", existing)).toEqual(existing)
    })

    it("returns empty object when both resourceId and existingData are absent", () => {
      expect(migrateResourceIdToData("DRIVE", undefined, null)).toEqual({})
    })
  })

  describe("when existingData is a legacy non-object value", () => {
    it("falls back to empty object when existingData is a string", () => {
      expect(
        migrateResourceIdToData(
          "DRIVE",
          "drive-abc",
          // legacy string payload coerced through untyped replication
          "some-legacy-string" as unknown as Record<string, unknown>,
        ),
      ).toEqual({ fileId: "abc" })
    })

    it("falls back to empty object when existingData is a number", () => {
      expect(
        migrateResourceIdToData(
          "DRIVE",
          "drive-abc",
          42 as unknown as Record<string, unknown>,
        ),
      ).toEqual({ fileId: "abc" })
    })

    it("falls back to empty object when existingData is an array", () => {
      expect(
        migrateResourceIdToData("DRIVE", "drive-abc", [
          "a",
          "b",
        ] as unknown as Record<string, unknown>),
      ).toEqual({ fileId: "abc" })
    })
  })

  describe("unknown type", () => {
    it("returns base unchanged for an unrecognized type", () => {
      expect(
        migrateResourceIdToData("unknown-plugin", "some-id", null),
      ).toEqual({})
    })

    it("preserves existing data for an unrecognized type", () => {
      const existing = { keep: true }
      expect(
        migrateResourceIdToData("unknown-plugin", "some-id", existing),
      ).toEqual(existing)
    })
  })

  describe("DRIVE type", () => {
    it("strips the drive- prefix", () => {
      expect(migrateResourceIdToData("DRIVE", "drive-abc123", null)).toEqual({
        fileId: "abc123",
      })
    })

    it("leaves the value intact when the prefix is missing", () => {
      expect(migrateResourceIdToData("DRIVE", "abc123", null)).toEqual({
        fileId: "abc123",
      })
    })

    it("does not strip a mid-string occurrence of the prefix token", () => {
      expect(migrateResourceIdToData("DRIVE", "foo-drive-bar", null)).toEqual({
        fileId: "foo-drive-bar",
      })
    })

    it("merges into existing data", () => {
      expect(
        migrateResourceIdToData("DRIVE", "drive-abc123", { extra: 1 }),
      ).toEqual({ extra: 1, fileId: "abc123" })
    })
  })

  describe("dropbox type", () => {
    it("strips the dropbox- prefix", () => {
      expect(
        migrateResourceIdToData("dropbox", "dropbox-file42", null),
      ).toEqual({ fileId: "file42" })
    })

    it("leaves the value intact when the prefix is missing", () => {
      expect(migrateResourceIdToData("dropbox", "file42", null)).toEqual({
        fileId: "file42",
      })
    })

    it("does not strip a mid-string occurrence of the prefix token", () => {
      expect(
        migrateResourceIdToData("dropbox", "my-dropbox-file", null),
      ).toEqual({ fileId: "my-dropbox-file" })
    })
  })

  describe("webdav type", () => {
    it("strips the webdav:// prefix and decodes", () => {
      expect(
        migrateResourceIdToData(
          "webdav",
          "webdav://path%2Fto%2Ffile.epub",
          null,
        ),
      ).toEqual({ filePath: "path/to/file.epub" })
    })

    it("handles missing prefix", () => {
      expect(
        migrateResourceIdToData("webdav", "path/to/file.epub", null),
      ).toEqual({ filePath: "path/to/file.epub" })
    })

    it("handles double-encoded values", () => {
      expect(
        migrateResourceIdToData("webdav", "webdav://path%252Fencoded", null),
      ).toEqual({ filePath: "path%2Fencoded" })
    })

    it("handles invalid percent sequences gracefully", () => {
      expect(
        migrateResourceIdToData("webdav", "webdav://%ZZbad", null),
      ).toEqual({ filePath: "%ZZbad" })
    })

    it("strips the host from legacy host-based format", () => {
      expect(
        migrateResourceIdToData(
          "webdav",
          "webdav://myhost:path%2Fto%2Ffile.epub",
          null,
        ),
      ).toEqual({ filePath: "path/to/file.epub" })
    })

    it("strips the dummy host from legacy _: format", () => {
      expect(
        migrateResourceIdToData(
          "webdav",
          "webdav://_:path%2Fto%2Ffile.epub",
          null,
        ),
      ).toEqual({ filePath: "path/to/file.epub" })
    })

    it("merges into existing data", () => {
      expect(
        migrateResourceIdToData("webdav", "webdav://file.epub", {
          other: true,
        }),
      ).toEqual({ other: true, filePath: "file.epub" })
    })
  })

  describe("synology-drive type", () => {
    it("strips the synology-drive:// prefix and decodes", () => {
      expect(
        migrateResourceIdToData(
          "synology-drive",
          "synology-drive://123456",
          null,
        ),
      ).toEqual({ fileId: "123456" })
    })

    it("handles missing prefix", () => {
      expect(migrateResourceIdToData("synology-drive", "123456", null)).toEqual(
        { fileId: "123456" },
      )
    })

    it("decodes URI-encoded values", () => {
      expect(
        migrateResourceIdToData(
          "synology-drive",
          "synology-drive://my%20file",
          null,
        ),
      ).toEqual({ fileId: "my file" })
    })

    it("handles double-encoded values", () => {
      expect(
        migrateResourceIdToData(
          "synology-drive",
          "synology-drive://id%2520encoded",
          null,
        ),
      ).toEqual({ fileId: "id%20encoded" })
    })

    it("handles invalid percent sequences gracefully", () => {
      expect(
        migrateResourceIdToData(
          "synology-drive",
          "synology-drive://%ZZbad",
          null,
        ),
      ).toEqual({ fileId: "%ZZbad" })
    })
  })

  describe("server type", () => {
    it("strips the server:// prefix and decodes", () => {
      expect(
        migrateResourceIdToData("server", "server://uploads%2Fbook.epub", null),
      ).toEqual({ filePath: "uploads/book.epub" })
    })

    it("handles missing prefix", () => {
      expect(
        migrateResourceIdToData("server", "uploads/book.epub", null),
      ).toEqual({ filePath: "uploads/book.epub" })
    })

    it("handles invalid percent sequences gracefully", () => {
      expect(
        migrateResourceIdToData("server", "server://%ZZbad", null),
      ).toEqual({ filePath: "%ZZbad" })
    })
  })

  describe("URI type", () => {
    it("strips the oboku-link- prefix", () => {
      expect(
        migrateResourceIdToData(
          "URI",
          "oboku-link-https://example.com/book.epub",
          null,
        ),
      ).toEqual({ url: "https://example.com/book.epub" })
    })

    it("leaves the value intact when the prefix is missing", () => {
      expect(
        migrateResourceIdToData("URI", "https://example.com/book.epub", null),
      ).toEqual({ url: "https://example.com/book.epub" })
    })

    it("does not strip a mid-string occurrence of the prefix token", () => {
      expect(
        migrateResourceIdToData(
          "URI",
          "https://example.com/oboku-link-book.epub",
          null,
        ),
      ).toEqual({ url: "https://example.com/oboku-link-book.epub" })
    })
  })

  describe("file type", () => {
    it("returns base unchanged", () => {
      expect(migrateResourceIdToData("file", "anything", null)).toEqual({})
    })

    it("preserves existing data", () => {
      expect(
        migrateResourceIdToData("file", "anything", { keep: true }),
      ).toEqual({ keep: true })
    })
  })
})
