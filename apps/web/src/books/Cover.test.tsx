import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Cover } from "./Cover"

vi.mock("./states", () => ({
  useBook: function useBook() {
    return {
      data: {
        _id: "book-1",
        tags: [],
        metadata: [{ type: "link", title: "Mistborn" }],
      },
    }
  },
}))
vi.mock("../tags/helpers", () => ({
  useBlurredTagIds: function useBlurredTagIds() {
    return { data: [] }
  },
}))
vi.mock("./useBookCover", () => ({
  useBookCover: function useBookCover() {
    return {
      coverSrc: undefined,
      coverSrcJpg: undefined,
      onError: function ignoreCoverError() {},
    }
  },
}))

afterEach(cleanup)

describe("Cover", () => {
  it("names the cover image after the book title", () => {
    render(<Cover bookId="book-1" />)

    expect(screen.getByRole("img", { name: "Mistborn" })).toBeTruthy()
  })

  it("hides a decorative cover from assistive technologies", () => {
    render(<Cover bookId="book-1" decorative />)

    expect(screen.queryByRole("img")).toBeNull()
  })
})
