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

  describe("when resourceId parses to identity fields", () => {
    it("adds them to empty data", () => {
      expect(migrateResourceIdToData("DRIVE", "drive-abc123", null)).toEqual({
        fileId: "abc123",
      })
    })

    it("merges them into existing data", () => {
      expect(
        migrateResourceIdToData("webdav", "webdav://file.epub", {
          other: true,
        }),
      ).toEqual({ other: true, filePath: "file.epub" })
    })

    it("overwrites an identity field already in the data", () => {
      expect(
        migrateResourceIdToData("DRIVE", "drive-abc123", { fileId: "old" }),
      ).toEqual({ fileId: "abc123" })
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
