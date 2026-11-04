import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { NEVER } from "rxjs"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { FileInspection } from "./useFileInspection"
import { book, link } from "./bookLink.fixture"
import { hasWritableMetadataTarget } from "./metadata/identifiers/containers"
import {
  CONTAINER_XML,
  inspect,
  opf,
} from "./metadata/identifiers/inspection.fixture"
import { OptimizeStep } from "./OptimizeStep"
import {
  BOOK_OPTIMIZE_TAB_PARAM,
  BOOK_OPTIMIZE_TABS,
  type BookOptimizeTab,
} from "./tabs"

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

const inspectBookWithIsbn = (isbn: string): Promise<FileInspection> =>
  inspect({
    "META-INF/container.xml": CONTAINER_XML,
    "OEBPS/content.opf": opf(
      '<dc:identifier id="pub-id">urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6</dc:identifier>' +
        `<dc:identifier opf:scheme="ISBN">${isbn}</dc:identifier>`,
    ),
  })

function TestOptimizeStep({
  bookToOptimize = book,
  openTab = BOOK_OPTIMIZE_TABS.METADATA,
}: {
  bookToOptimize?: typeof book
  openTab?: BookOptimizeTab
}) {
  const tabSearch = new URLSearchParams({ [BOOK_OPTIMIZE_TAB_PARAM]: openTab })

  return (
    <MemoryRouter initialEntries={[`/?${tabSearch.toString()}`]}>
      <OptimizeStep
        book={bookToOptimize}
        link={link}
        canUploadToDataSource={false}
      />
    </MemoryRouter>
  )
}

const expectFormValidity = (validity: "valid" | "invalid") =>
  waitFor(function expectFormValidityOutput() {
    expect(screen.getByLabelText("Form validity").textContent).toBe(validity)
  })

const getTab = (label: string): HTMLElement =>
  screen.getByRole("tab", { name: new RegExp(`^${label}`) })

const queryTabErrorMarker = (label: string): HTMLElement | null =>
  within(getTab(label)).queryByRole("img", { name: "Has errors" })

describe("OptimizeStep", function testOptimizeStep() {
  afterEach(function cleanUpOptimizeStep() {
    cleanup()
    mocks.inspectionsByBookId.clear()
  })

  it("marks the Metadata tab and shows the error of an identifier the book carries", async function markMetadataTabForSeededIdentifierError() {
    mocks.inspectionsByBookId.set(book._id, await inspectBookWithIsbn("978-0"))

    render(<TestOptimizeStep openTab={BOOK_OPTIMIZE_TABS.CONTENT} />)

    expect(
      await screen.findByText("Not a recognizable ISBN-10 or ISBN-13"),
    ).not.toBeNull()
    await expectFormValidity("invalid")
    expect(queryTabErrorMarker("Metadata")).not.toBeNull()
    expect(queryTabErrorMarker("Content")).toBeNull()

    const isbnField = screen.getByDisplayValue("978-0")

    expect(isbnField.getAttribute("aria-invalid")).toBe("true")

    fireEvent.change(isbnField, { target: { value: "9783161484100" } })

    await expectFormValidity("valid")
    expect(queryTabErrorMarker("Metadata")).toBeNull()
  })

  it("marks the Metadata tab when it is left with an added identifier still empty", async function markMetadataTabForEmptyAddedIdentifier() {
    mocks.inspectionsByBookId.set(
      book._id,
      await inspectBookWithIsbn("9783161484100"),
    )

    render(<TestOptimizeStep />)

    await expectFormValidity("valid")
    fireEvent.click(screen.getByRole("button", { name: "Add identifier" }))
    await expectFormValidity("invalid")
    fireEvent.click(getTab("Content"))

    expect(await screen.findByText("Required")).not.toBeNull()
    expect(getTab("Content").getAttribute("aria-selected")).toBe("true")
    expect(queryTabErrorMarker("Metadata")).not.toBeNull()
  })

  it("marks the Content tab when an image option is in error while Metadata is open", async function markContentTabFromMetadataTab() {
    mocks.inspectionsByBookId.set(
      book._id,
      await inspectBookWithIsbn("9783161484100"),
    )

    render(<TestOptimizeStep />)

    await expectFormValidity("valid")
    expect(queryTabErrorMarker("Content")).toBeNull()

    fireEvent.click(screen.getByLabelText("Compress images"))

    expect(
      await screen.findByText(
        "Set a maximum width or height when keeping the original format.",
      ),
    ).not.toBeNull()
    expect(queryTabErrorMarker("Content")).not.toBeNull()
    expect(queryTabErrorMarker("Metadata")).toBeNull()
  })

  it("keeps the edits when the inspection of the same book refreshes", async function keepEditsOnInspectionRefresh() {
    mocks.inspectionsByBookId.set(
      book._id,
      await inspectBookWithIsbn("9783161484100"),
    )

    const { rerender } = render(<TestOptimizeStep />)

    fireEvent.change(await screen.findByDisplayValue("9783161484100"), {
      target: { value: "9780306406157" },
    })

    mocks.inspectionsByBookId.set(
      book._id,
      await inspectBookWithIsbn("9781861972712"),
    )
    rerender(<TestOptimizeStep />)

    expect(screen.getByDisplayValue("9780306406157")).not.toBeNull()
    expect(screen.queryByDisplayValue("9781861972712")).toBeNull()
  })

  it("leaves unchecked the identifiers of a book that has nowhere to store them", async function skipIdentifiersWithNowhereToStore() {
    const inspection = await inspect({
      "META-INF/container.xml": CONTAINER_XML,
      "OEBPS/content.opf": opf(
        '<dc:identifier id="pub-id">urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6</dc:identifier>' +
          '<dc:identifier opf:scheme="ISBN">978-0</dc:identifier>',
      ),
      "ComicInfo.xml": "not xml",
    })

    expect(hasWritableMetadataTarget(inspection)).toBe(false)

    mocks.inspectionsByBookId.set(book._id, inspection)

    render(<TestOptimizeStep />)

    expect(await screen.findByDisplayValue("978-0")).not.toBeNull()
    await expectFormValidity("valid")
    expect(
      screen.queryByText("Not a recognizable ISBN-10 or ISBN-13"),
    ).toBeNull()
    expect(queryTabErrorMarker("Metadata")).toBeNull()
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

    const { rerender } = render(<TestOptimizeStep />)

    expect(await screen.findByDisplayValue("9783161484100")).not.toBeNull()

    rerender(<TestOptimizeStep bookToOptimize={otherBook} />)

    expect(await screen.findByDisplayValue("9780306406157")).not.toBeNull()
    expect(screen.queryByDisplayValue("9783161484100")).toBeNull()
  })
})
