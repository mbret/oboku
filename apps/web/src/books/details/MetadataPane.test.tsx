import type { BookMetadata } from "@oboku/shared"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { MetadataPane } from "./MetadataPane"

const { useBook } = vi.hoisted(() => ({ useBook: vi.fn() }))

vi.mock("../states", () => ({ useBook }))
vi.mock("./TagsRow", () => ({
  TagsRow: function TagsRow() {
    return null
  },
}))

afterEach(cleanup)

const renderPaneForBookWith = (metadata: BookMetadata[]) => {
  useBook.mockReturnValue({ data: { _id: "book-1", metadata } })

  render(<MetadataPane bookId="book-1" />)
}

const getFileSizeRow = () =>
  screen
    .getAllByRole("listitem")
    .find((item) => item.textContent?.startsWith("File size"))

describe("MetadataPane, the file size row", () => {
  it("shows the size the storage provider reports for the link", () => {
    renderPaneForBookWith([
      { type: "link", title: "Mistborn.epub", size: "95000000" },
    ])

    expect(getFileSizeRow()?.textContent).toBe("File size95.0 MB")
  })

  it("shows unknown when no source reports a size", () => {
    renderPaneForBookWith([{ type: "link", title: "Mistborn.epub" }])

    expect(getFileSizeRow()?.textContent).toBe("File sizeunknown")
  })
})
