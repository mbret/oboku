import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { NEVER } from "rxjs"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { FileInspection } from "./useFileInspection"
import { book, link } from "./bookLink.fixture"
import {
  CONTAINER_XML,
  inspect,
  opf,
} from "./metadata/identifiers/inspection.fixture"
import { resolveMetadataFixerFormValues } from "./metadata/identifiers/resolveMetadataFixerFormValues"
import { IDENTIFIER_SCHEME_OPTIONS } from "./metadata/identifiers/schemes"
import { OptimizeStep } from "./OptimizeStep"
import { BOOK_OPTIMIZE_TABS, type BookOptimizeTab } from "./tabs"

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

vi.mock("./actions/BookOptimizeActionBar", async function mockActionBar() {
  const { useBookOptimize } = await import("./BookOptimizeContext")

  return {
    BookOptimizeActionBar: function FormValidity() {
      const { isValid } = useBookOptimize()

      return (
        <output aria-label="Form validity">
          {isValid ? "valid" : "invalid"}
        </output>
      )
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

const UNIQUE_IDENTIFIER =
  '<dc:identifier id="pub-id">urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6</dc:identifier>'

const inspectBookWithIdentifiers = (
  identifiers: string,
): Promise<FileInspection> =>
  inspect({
    "META-INF/container.xml": CONTAINER_XML,
    "OEBPS/content.opf": opf(`${UNIQUE_IDENTIFIER}${identifiers}`),
  })

const inspectBookWithIsbn = (isbn: string): Promise<FileInspection> =>
  inspectBookWithIdentifiers(
    `<dc:identifier opf:scheme="ISBN">${isbn}</dc:identifier>`,
  )

const renderOptimizeStep = ({
  bookToOptimize = book,
  currentTab = BOOK_OPTIMIZE_TABS.METADATA,
}: {
  bookToOptimize?: typeof book
  currentTab?: BookOptimizeTab
} = {}) => (
  <OptimizeStep
    book={bookToOptimize}
    link={link}
    canUploadToDataSource={false}
    currentTab={currentTab}
  />
)

const expectFormValidity = (validity: "valid" | "invalid") =>
  waitFor(function expectFormValidityOutput() {
    expect(screen.getByLabelText("Form validity").textContent).toBe(validity)
  })

describe("OptimizeStep", function testOptimizeStep() {
  afterEach(function cleanUpOptimizeStep() {
    cleanup()
    mocks.inspectionsByBookId.clear()
  })

  it("shows the error of an identifier the book carries, on whichever tab is open", async function showSeededIdentifierError() {
    mocks.inspectionsByBookId.set(book._id, await inspectBookWithIsbn("978-0"))

    render(renderOptimizeStep({ currentTab: BOOK_OPTIMIZE_TABS.CONTENT }))

    expect(
      await screen.findByText("Not a recognizable ISBN-10 or ISBN-13"),
    ).not.toBeNull()
    await expectFormValidity("invalid")

    const isbnField = screen.getByDisplayValue("978-0")

    expect(isbnField.getAttribute("aria-invalid")).toBe("true")

    fireEvent.change(isbnField, { target: { value: "9783161484100" } })

    await expectFormValidity("valid")
  })

  it("opens a book with a valid identifier of every scheme with no error", async function openEverySchemeValid() {
    const inspection = await inspectBookWithIdentifiers(
      '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>' +
        '<dc:identifier opf:scheme="GoogleBooks">zyTCAlFPjgYC</dc:identifier>' +
        '<dc:identifier opf:scheme="GTIN">4006381333931</dc:identifier>' +
        '<dc:identifier opf:scheme="OpenLibrary">OL7353617M</dc:identifier>' +
        '<dc:identifier opf:scheme="ProjectGutenberg">2701</dc:identifier>' +
        '<dc:identifier opf:scheme="DOI">10.1000/182</dc:identifier>' +
        "<dc:identifier>urn:nbn:de:101:1-2011</dc:identifier>" +
        "<dc:identifier>https://example.com/book</dc:identifier>" +
        "<dc:identifier>acme-0042</dc:identifier>",
    )
    const seededSchemes = resolveMetadataFixerFormValues(
      inspection,
    ).identifiers.map((identifier) => identifier.scheme)

    expect(new Set(seededSchemes)).toEqual(
      new Set(IDENTIFIER_SCHEME_OPTIONS.map((option) => option.scheme)),
    )

    mocks.inspectionsByBookId.set(book._id, inspection)

    const { container } = render(renderOptimizeStep())

    await expectFormValidity("valid")
    expect(container.querySelector('[aria-invalid="true"]')).toBeNull()
  })

  it("keeps the edits when the inspection of the same book refreshes", async function keepEditsOnInspectionRefresh() {
    mocks.inspectionsByBookId.set(
      book._id,
      await inspectBookWithIsbn("9783161484100"),
    )

    const { rerender } = render(renderOptimizeStep())

    fireEvent.change(await screen.findByDisplayValue("9783161484100"), {
      target: { value: "9780306406157" },
    })

    mocks.inspectionsByBookId.set(
      book._id,
      await inspectBookWithIsbn("9781861972712"),
    )
    rerender(renderOptimizeStep())

    expect(screen.getByDisplayValue("9780306406157")).not.toBeNull()
    expect(screen.queryByDisplayValue("9781861972712")).toBeNull()
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

    const { rerender } = render(renderOptimizeStep())

    expect(await screen.findByDisplayValue("9783161484100")).not.toBeNull()

    rerender(renderOptimizeStep({ bookToOptimize: otherBook }))

    expect(await screen.findByDisplayValue("9780306406157")).not.toBeNull()
    expect(screen.queryByDisplayValue("9783161484100")).toBeNull()
  })
})
