import { describe, expect, it } from "vitest"
import { collectionPassesNotInterestedFilter } from "./collectionPassesNotInterestedFilter"

describe("collectionPassesNotInterestedFilter", () => {
  describe(`when isNotInterested is "only"`, () => {
    it("keeps a collection containing at least one not interested book", () => {
      expect(
        collectionPassesNotInterestedFilter({
          collectionBooks: ["book-1", "book-2"],
          isNotInterested: "only",
          notInterestedBookIds: ["book-2"],
        }),
      ).toBe(true)
    })

    it("filters out a collection containing no not interested book", () => {
      expect(
        collectionPassesNotInterestedFilter({
          collectionBooks: ["book-1", "book-2"],
          isNotInterested: "only",
          notInterestedBookIds: ["book-3"],
        }),
      ).toBe(false)
    })

    it("filters out a collection when there is no not interested book at all", () => {
      expect(
        collectionPassesNotInterestedFilter({
          collectionBooks: ["book-1", "book-2"],
          isNotInterested: "only",
          notInterestedBookIds: [],
        }),
      ).toBe(false)
    })

    it("filters out an empty collection", () => {
      expect(
        collectionPassesNotInterestedFilter({
          collectionBooks: [],
          isNotInterested: "only",
          notInterestedBookIds: ["book-1"],
        }),
      ).toBe(false)
    })
  })

  describe(`when isNotInterested is "none"`, () => {
    it("filters out a collection containing only not interested books", () => {
      expect(
        collectionPassesNotInterestedFilter({
          collectionBooks: ["book-1", "book-2"],
          isNotInterested: "none",
          notInterestedBookIds: ["book-1", "book-2"],
        }),
      ).toBe(false)
    })

    it("keeps a collection containing at least one interesting book", () => {
      expect(
        collectionPassesNotInterestedFilter({
          collectionBooks: ["book-1", "book-2"],
          isNotInterested: "none",
          notInterestedBookIds: ["book-2"],
        }),
      ).toBe(true)
    })

    it("keeps an empty collection", () => {
      expect(
        collectionPassesNotInterestedFilter({
          collectionBooks: [],
          isNotInterested: "none",
          notInterestedBookIds: ["book-1"],
        }),
      ).toBe(true)
    })
  })

  describe(`when isNotInterested is "with" or undefined`, () => {
    it("keeps every collection", () => {
      expect(
        collectionPassesNotInterestedFilter({
          collectionBooks: ["book-1"],
          isNotInterested: "with",
          notInterestedBookIds: ["book-1"],
        }),
      ).toBe(true)

      expect(
        collectionPassesNotInterestedFilter({
          collectionBooks: ["book-1"],
          isNotInterested: undefined,
          notInterestedBookIds: ["book-1"],
        }),
      ).toBe(true)
    })
  })
})
