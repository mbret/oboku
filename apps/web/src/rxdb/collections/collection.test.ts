import { describe, expect, it } from "vitest"
import { migrateLinkResourceIdToLinkData } from "./collection"

describe("migrateLinkResourceIdToLinkData", () => {
  describe("when linkResourceId or linkType is missing", () => {
    it("returns existingLinkData when linkResourceId is undefined", () => {
      const existing = { foo: "bar" }
      expect(
        migrateLinkResourceIdToLinkData("DRIVE", undefined, existing),
      ).toEqual(existing)
    })

    it("returns existingLinkData when linkType is undefined", () => {
      const existing = { foo: "bar" }
      expect(
        migrateLinkResourceIdToLinkData(undefined, "drive-abc", existing),
      ).toEqual(existing)
    })

    it("returns undefined when both are missing and no existing data", () => {
      expect(
        migrateLinkResourceIdToLinkData(undefined, undefined, undefined),
      ).toBeUndefined()
    })

    it("returns existingLinkData when linkResourceId is empty string", () => {
      const existing = { foo: "bar" }
      expect(migrateLinkResourceIdToLinkData("DRIVE", "", existing)).toEqual(
        existing,
      )
    })
  })

  describe("unknown type", () => {
    it("returns base unchanged for an unrecognized type", () => {
      expect(
        migrateLinkResourceIdToLinkData("unknown-plugin", "some-id", undefined),
      ).toEqual({})
    })

    it("preserves existing data for an unrecognized type", () => {
      const existing = { keep: true }
      expect(
        migrateLinkResourceIdToLinkData("unknown-plugin", "some-id", existing),
      ).toEqual(existing)
    })
  })

  describe("DRIVE type", () => {
    it("strips the drive- prefix", () => {
      expect(
        migrateLinkResourceIdToLinkData("DRIVE", "drive-abc123", undefined),
      ).toEqual({ fileId: "abc123" })
    })

    it("is a no-op when the prefix is missing", () => {
      expect(
        migrateLinkResourceIdToLinkData("DRIVE", "abc123", undefined),
      ).toEqual({ fileId: "abc123" })
    })

    it("merges into existing data", () => {
      expect(
        migrateLinkResourceIdToLinkData("DRIVE", "drive-abc123", { extra: 1 }),
      ).toEqual({ extra: 1, fileId: "abc123" })
    })
  })

  describe("dropbox type", () => {
    it("strips the dropbox- prefix", () => {
      expect(
        migrateLinkResourceIdToLinkData("dropbox", "dropbox-file42", undefined),
      ).toEqual({ fileId: "file42" })
    })

    it("is a no-op when the prefix is missing", () => {
      expect(
        migrateLinkResourceIdToLinkData("dropbox", "file42", undefined),
      ).toEqual({ fileId: "file42" })
    })
  })

  describe("webdav type", () => {
    it("strips the webdav:// prefix and decodes", () => {
      expect(
        migrateLinkResourceIdToLinkData(
          "webdav",
          "webdav://path%2Fto%2Ffile.epub",
          undefined,
        ),
      ).toEqual({ filePath: "path/to/file.epub" })
    })

    it("handles missing prefix", () => {
      expect(
        migrateLinkResourceIdToLinkData(
          "webdav",
          "path/to/file.epub",
          undefined,
        ),
      ).toEqual({ filePath: "path/to/file.epub" })
    })

    it("handles double-encoded values", () => {
      expect(
        migrateLinkResourceIdToLinkData(
          "webdav",
          "webdav://path%252Fencoded",
          undefined,
        ),
      ).toEqual({ filePath: "path%2Fencoded" })
    })

    it("handles invalid percent sequences gracefully", () => {
      expect(
        migrateLinkResourceIdToLinkData("webdav", "webdav://%ZZbad", undefined),
      ).toEqual({ filePath: "%ZZbad" })
    })

    it("merges into existing data", () => {
      expect(
        migrateLinkResourceIdToLinkData("webdav", "webdav://file.epub", {
          other: true,
        }),
      ).toEqual({ other: true, filePath: "file.epub" })
    })
  })

  describe("synology-drive type", () => {
    it("strips the synology-drive:// prefix and decodes", () => {
      expect(
        migrateLinkResourceIdToLinkData(
          "synology-drive",
          "synology-drive://123456",
          undefined,
        ),
      ).toEqual({ fileId: "123456" })
    })

    it("handles missing prefix", () => {
      expect(
        migrateLinkResourceIdToLinkData("synology-drive", "123456", undefined),
      ).toEqual({ fileId: "123456" })
    })

    it("decodes URI-encoded values", () => {
      expect(
        migrateLinkResourceIdToLinkData(
          "synology-drive",
          "synology-drive://my%20file",
          undefined,
        ),
      ).toEqual({ fileId: "my file" })
    })

    it("handles double-encoded values", () => {
      expect(
        migrateLinkResourceIdToLinkData(
          "synology-drive",
          "synology-drive://id%2520encoded",
          undefined,
        ),
      ).toEqual({ fileId: "id%20encoded" })
    })

    it("handles invalid percent sequences gracefully", () => {
      expect(
        migrateLinkResourceIdToLinkData(
          "synology-drive",
          "synology-drive://%ZZbad",
          undefined,
        ),
      ).toEqual({ fileId: "%ZZbad" })
    })
  })

  describe("server type", () => {
    it("strips the server:// prefix and decodes", () => {
      expect(
        migrateLinkResourceIdToLinkData(
          "server",
          "server://uploads%2Fbook.epub",
          undefined,
        ),
      ).toEqual({ filePath: "uploads/book.epub" })
    })

    it("handles missing prefix", () => {
      expect(
        migrateLinkResourceIdToLinkData(
          "server",
          "uploads/book.epub",
          undefined,
        ),
      ).toEqual({ filePath: "uploads/book.epub" })
    })

    it("handles invalid percent sequences gracefully", () => {
      expect(
        migrateLinkResourceIdToLinkData("server", "server://%ZZbad", undefined),
      ).toEqual({ filePath: "%ZZbad" })
    })
  })

  describe("URI type", () => {
    it("strips the oboku-link- prefix", () => {
      expect(
        migrateLinkResourceIdToLinkData(
          "URI",
          "oboku-link-https://example.com/book.epub",
          undefined,
        ),
      ).toEqual({ url: "https://example.com/book.epub" })
    })

    it("is a no-op when the prefix is missing", () => {
      expect(
        migrateLinkResourceIdToLinkData(
          "URI",
          "https://example.com/book.epub",
          undefined,
        ),
      ).toEqual({ url: "https://example.com/book.epub" })
    })
  })

  describe("file type", () => {
    it("returns base unchanged", () => {
      expect(
        migrateLinkResourceIdToLinkData("file", "anything", undefined),
      ).toEqual({})
    })

    it("preserves existing data", () => {
      expect(
        migrateLinkResourceIdToLinkData("file", "anything", { keep: true }),
      ).toEqual({ keep: true })
    })
  })
})
