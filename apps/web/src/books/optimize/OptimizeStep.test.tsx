import { cleanup, render, screen } from "@testing-library/react"
import { NEVER } from "rxjs"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { FileInspection } from "./useFileInspection"
import { book, link } from "./bookLink.fixture"
import {
  CONTAINER_XML,
  inspect,
  opf,
} from "./metadata/identifiers/inspection.fixture"
import { OptimizeStep } from "./OptimizeStep"
import { BOOK_OPTIMIZE_TABS } from "./tabs"

const mocks = vi.hoisted(function createMocks() {
  return { inspectionsByBookId: new Map<string, FileInspection>() }
})

vi.mock("./useFileInspection", function mockFileInspection() {
  return {
    useFileInspection: function useInspectionOfBook(bookId: string) {
      return { data: mocks.inspectionsByBookId.get(bookId), isError: false }
    },
  }
})

vi.mock("./actions/BookOptimizeActionBar", function mockActionBar() {
  return {
    BookOptimizeActionBar: function NoActionBar() {
      return null
    },
  }
})

vi.mock("./actions/useUploadToDataSource", function mockUploadToDataSource() {
  return {
    useUploadToDataSource: function useNoUpload() {
      return {
        uploadToDataSource: vi.fn(),
        isUploading: false,
        canUpload: false,
        slot: null,
        uploadProgress$: NEVER,
      }
    },
  }
})

vi.mock("./actions/useRevertLocalChanges", function mockRevertLocalChanges() {
  return {
    useRevertLocalChanges: function useNoRevert() {
      return {
        revertLocalChanges: vi.fn(),
        isReverting: false,
        canRevert: false,
      }
    },
  }
})

vi.mock("./apply/useApplyLocally", function mockApplyLocally() {
  return {
    useIsApplyingLocally: function isNotApplyingLocally() {
      return false
    },
  }
})

const otherBook = { ...book, _id: "book-2" }

const inspectBookWithIsbn = (isbn: string): Promise<FileInspection> =>
  inspect({
    "META-INF/container.xml": CONTAINER_XML,
    "OEBPS/content.opf": opf(
      `<dc:identifier id="pub-id" opf:scheme="ISBN">${isbn}</dc:identifier>`,
    ),
  })

describe("OptimizeStep", function testOptimizeStep() {
  afterEach(function cleanUpOptimizeStep() {
    cleanup()
    mocks.inspectionsByBookId.clear()
  })

  it("seeds the form again with the values of another book", async function seedAnotherBook() {
    mocks.inspectionsByBookId.set(
      book._id,
      await inspectBookWithIsbn("9783161484100"),
    )
    mocks.inspectionsByBookId.set(
      otherBook._id,
      await inspectBookWithIsbn("9780306406157"),
    )

    const { rerender } = render(
      <OptimizeStep
        book={book}
        link={link}
        canUploadToDataSource={false}
        currentTab={BOOK_OPTIMIZE_TABS.METADATA}
      />,
    )

    expect(await screen.findByDisplayValue("9783161484100")).not.toBeNull()

    rerender(
      <OptimizeStep
        book={otherBook}
        link={link}
        canUploadToDataSource={false}
        currentTab={BOOK_OPTIMIZE_TABS.METADATA}
      />,
    )

    expect(await screen.findByDisplayValue("9780306406157")).not.toBeNull()
    expect(screen.queryByDisplayValue("9783161484100")).toBeNull()
  })
})
