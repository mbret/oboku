import { type BookDocType, createBookDefaults } from "@oboku/shared"
import { describe, expect, it } from "vitest"
import { sortBooksBy } from "./helpers"

const createBook = (
  book: Pick<BookDocType, "_id"> & Partial<BookDocType>,
): BookDocType => ({
  ...createBookDefaults(),
  _rev: "1-book",
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
  ...book,
})

describe("sortBooksBy", () => {
  it("puts the most recently added first and keeps books added together in their order", () => {
    const books = [
      createBook({ _id: "a", createdAt: 5 }),
      createBook({ _id: "b", createdAt: 5 }),
      createBook({ _id: "c", createdAt: 9 }),
      createBook({ _id: "d", createdAt: 5 }),
    ]

    expect(sortBooksBy(books, "date").map((book) => book._id)).toEqual([
      "c",
      "a",
      "b",
      "d",
    ])
  })

  it("orders by title, with numbers in natural order", () => {
    const books = [
      createBook({
        _id: "vol-10",
        metadata: [{ type: "link", title: "Vol. 10" }],
      }),
      createBook({
        _id: "vol-2",
        metadata: [{ type: "link", title: "Vol. 2" }],
      }),
      createBook({
        _id: "annex",
        metadata: [{ type: "link", title: "Annex" }],
      }),
    ]

    expect(sortBooksBy(books, "alpha").map((book) => book._id)).toEqual([
      "annex",
      "vol-2",
      "vol-10",
    ])
  })
})
