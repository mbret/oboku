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

  describe("when the type has no identity fields", () => {
    it("returns an empty object without existing data", () => {
      expect(
        migrateLinkResourceIdToLinkData("unknown-plugin", "some-id", undefined),
      ).toEqual({})
    })

    it("preserves existing data", () => {
      expect(
        migrateLinkResourceIdToLinkData("file", "anything", { keep: true }),
      ).toEqual({ keep: true })
    })
  })

  describe("when linkResourceId parses to identity fields", () => {
    it("adds them to empty data", () => {
      expect(
        migrateLinkResourceIdToLinkData("DRIVE", "drive-abc123", undefined),
      ).toEqual({ fileId: "abc123" })
    })

    it("merges them into existing data", () => {
      expect(
        migrateLinkResourceIdToLinkData("webdav", "webdav://file.epub", {
          other: true,
        }),
      ).toEqual({ other: true, filePath: "file.epub" })
    })
  })
})
