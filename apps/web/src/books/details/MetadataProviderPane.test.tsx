import type { BookMetadata, CatalogMetadata } from "@oboku/shared"
import { cleanup, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

const { useBook } = vi.hoisted(function createBookMock() {
  return { useBook: vi.fn() }
})

vi.mock("../states", function mockBookStates() {
  return { useBook }
})
vi.mock("../../links/states", function mockLinkStates() {
  return {
    useLink: function useLink() {
      return { data: undefined }
    },
  }
})
vi.mock("../useIncrementalBookPatch", function mockIncrementalBookPatch() {
  return {
    useIncrementalBookPatch: function useIncrementalBookPatch() {
      return { mutate: vi.fn() }
    },
  }
})

import { MetadataProviderPane } from "./MetadataProviderPane"

const DOI_ONLY_CATALOG_MATCH = {
  type: "catalog",
  version: 1,
  providerId: "openLibrary",
  score: 1,
  accepted: true,
  signals: [],
  metadata: { identifiers: [{ scheme: "DOI", value: "10.1000/182" }] },
} satisfies CatalogMetadata

const FILE_WITH_TITLE_AND_ISBN = {
  type: "file",
  version: 5,
  metadata: {
    titles: [{ value: "Mistborn" }],
    identifiers: [{ scheme: "ISBN", value: "9780765311788" }],
  },
} satisfies BookMetadata

function renderPaneForBookMetadata(metadata: BookMetadata[]) {
  useBook.mockReturnValue({
    data: { _id: "book-1", links: [], metadata },
  })

  render(
    <MemoryRouter>
      <MetadataProviderPane bookId="book-1" />
    </MemoryRouter>,
  )
}

function getProviderRow(label: string) {
  const row = screen.getByText(label).closest("li")

  if (!row) throw new Error(`No row shows ${label}`)

  return within(row)
}

afterEach(cleanup)

describe("MetadataProviderPane, the properties of each provider", () => {
  it("counts and previews a catalog match whose only data is an identifier", () => {
    renderPaneForBookMetadata([DOI_ONLY_CATALOG_MATCH])

    const catalogRow = getProviderRow("Catalog")

    expect(catalogRow.getByText("1 properties")).toBeTruthy()
    expect(catalogRow.getByText("10.1000/182")).toBeTruthy()
    expect(catalogRow.queryByText("No data yet")).toBeNull()
  })

  it("counts an ISBN once, as the identifier the file provider screen shows", () => {
    renderPaneForBookMetadata([FILE_WITH_TITLE_AND_ISBN])

    expect(getProviderRow("File").getByText("2 properties")).toBeTruthy()
  })
})
