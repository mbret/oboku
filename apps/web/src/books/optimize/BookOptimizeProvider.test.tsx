import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { NEVER } from "rxjs"
import { afterEach, describe, expect, it, vi } from "vitest"
import { BookOptimizeProvider, useBookOptimize } from "./BookOptimizeProvider"
import { ContentTab } from "./ContentTab"
import { MetadataTab } from "./MetadataTab"
import { book, link } from "./bookLink.fixture"
import {
  CONTAINER_XML,
  inspect,
  opf,
} from "./metadata/identifiers/inspection.fixture"
import type { FileInspection } from "./useFileInspection"

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

const UNIQUE_IDENTIFIER =
  '<dc:identifier id="pub-id">urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6</dc:identifier>'

const inspectBookWithIsbn = (isbn: string): Promise<FileInspection> =>
  inspect({
    "META-INF/container.xml": CONTAINER_XML,
    "OEBPS/content.opf": opf(
      `${UNIQUE_IDENTIFIER}<dc:identifier opf:scheme="ISBN">${isbn}</dc:identifier>`,
    ),
  })

function FormValidity() {
  const { isValid } = useBookOptimize()

  return (
    <output aria-label="Form validity">{isValid ? "valid" : "invalid"}</output>
  )
}

function OptimizeForm({ inspection }: { inspection: FileInspection }) {
  return (
    <BookOptimizeProvider
      book={book}
      link={link}
      canUploadToDataSource={false}
      inspection={inspection}
    >
      <FormValidity />
      <MetadataTab hidden={false} />
      <ContentTab hidden={false} />
    </BookOptimizeProvider>
  )
}

const expectFormValidity = (validity: "valid" | "invalid") =>
  waitFor(function expectFormValidityOutput() {
    expect(screen.getByLabelText("Form validity").textContent).toBe(validity)
  })

describe("BookOptimizeProvider", function testBookOptimizeProvider() {
  afterEach(function cleanUpBookOptimizeProvider() {
    cleanup()
  })

  it("shows why an identifier the book carries keeps the form invalid", async function showSeededIdentifierError() {
    render(<OptimizeForm inspection={await inspectBookWithIsbn("978-0")} />)

    expect(
      await screen.findByText("Not a recognizable ISBN-10 or ISBN-13"),
    ).not.toBeNull()

    const isbnField = screen.getByDisplayValue("978-0")

    expect(isbnField.getAttribute("aria-invalid")).toBe("true")

    fireEvent.change(isbnField, { target: { value: "9783161484100" } })

    await expectFormValidity("valid")
  })

  it("opens a book whose values are valid with no field in error", async function openValidBook() {
    const { container } = render(
      <OptimizeForm inspection={await inspectBookWithIsbn("9783161484100")} />,
    )

    expect(await screen.findByDisplayValue("9783161484100")).not.toBeNull()
    await expectFormValidity("valid")
    expect(container.querySelector('[aria-invalid="true"]')).toBeNull()
  })

  it("keeps the edits when the inspection of the same book refreshes", async function keepEditsOnInspectionRefresh() {
    const { rerender } = render(
      <OptimizeForm inspection={await inspectBookWithIsbn("9783161484100")} />,
    )

    fireEvent.change(await screen.findByDisplayValue("9783161484100"), {
      target: { value: "9780306406157" },
    })

    rerender(
      <OptimizeForm inspection={await inspectBookWithIsbn("9781861972712")} />,
    )

    expect(screen.getByDisplayValue("9780306406157")).not.toBeNull()
    expect(screen.queryByDisplayValue("9781861972712")).toBeNull()
  })
})
