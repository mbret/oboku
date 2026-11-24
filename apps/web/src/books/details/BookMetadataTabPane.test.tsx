import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"
import { BookMetadataTabPane } from "./BookMetadataTabPane"

const { useBook } = vi.hoisted(function createBookMock() {
  return { useBook: vi.fn() }
})

vi.mock("../states", function mockBookStates() {
  return { useBook }
})
vi.mock(
  "../../metadata/useResolvedMetadataFetchEnabled",
  async function mockResolvedMetadataFetchEnabled(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../../metadata/useResolvedMetadataFetchEnabled")
      >()),
      useResolvedMetadataFetchEnabled:
        function useResolvedMetadataFetchEnabled() {
          return { override: null, isProtected: false, resolved: true }
        },
    }
  },
)
vi.mock("../useIncrementalBookPatch", function mockIncrementalBookPatch() {
  return {
    useIncrementalBookPatch: function useIncrementalBookPatch() {
      return { mutate: vi.fn() }
    },
  }
})
vi.mock("../useRefreshBookMetadata", function mockRefreshBookMetadata() {
  return {
    useRefreshBookMetadata: function useRefreshBookMetadata() {
      return vi.fn()
    },
  }
})
vi.mock("./MetadataSourcePane", function mockMetadataSourcePane() {
  return {
    MetadataSourcePane: function MetadataSourcePane() {
      return null
    },
  }
})
vi.mock("./DataSourceSection", function mockDataSourceSection() {
  return {
    DataSourceSection: function DataSourceSection() {
      return null
    },
  }
})

afterEach(cleanup)

function renderTabPaneForBookRefreshedAt(lastMetadataUpdatedAt: number | null) {
  useBook.mockReturnValue({
    data: { _id: "book-1", lastMetadataUpdatedAt, metadata: [] },
  })

  render(
    <MemoryRouter>
      <BookMetadataTabPane bookId="book-1" />
    </MemoryRouter>,
  )
}

describe("BookMetadataTabPane, the last refresh line", () => {
  it("shows the date of the last metadata refresh", () => {
    renderTabPaneForBookRefreshedAt(new Date(2026, 10, 10, 12).getTime())

    expect(screen.getByText("Last refreshed on Nov 10, 2026")).toBeTruthy()
  })

  it("shows nothing when the metadata was never refreshed", () => {
    renderTabPaneForBookRefreshedAt(null)

    expect(screen.queryByText(/Last refreshed/)).toBeNull()
  })
})
