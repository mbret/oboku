import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import {
  type BookDocType,
  type LinkDocTypeForProvider,
  ReadingStateState,
} from "@oboku/shared"
import { NEVER } from "rxjs"
import { afterEach, describe, expect, it, vi } from "vitest"
import { BookOptimizeProvider, useBookOptimize } from "./BookOptimizeProvider"
import { MetadataForm } from "./metadata/MetadataForm"
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

const book: BookDocType = {
  _id: "book-1",
  _rev: "1-book",
  collections: [],
  createdAt: 1,
  isAttachedToDataSource: true,
  lastMetadataUpdateError: null,
  lastMetadataUpdatedAt: null,
  links: ["link-1"],
  metadataUpdateStatus: null,
  modifiedAt: null,
  readingStateCurrentBookmarkLocation: null,
  readingStateCurrentBookmarkProgressPercent: 0,
  readingStateUpdatedAt: null,
  readingStateCurrentState: ReadingStateState.NotStarted,
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
  tags: [],
}

const link: LinkDocTypeForProvider<"URI"> = {
  _id: "link-1",
  _rev: "1-link",
  book: book._id,
  createdAt: "2026-08-01T00:00:00.000Z",
  data: { url: "https://example.com/book.epub" },
  modifiedAt: null,
  rx_model: "link",
  rxdbMeta: { lwt: 1 },
  type: "URI",
}

function FormValidity() {
  const { isValid } = useBookOptimize()

  return (
    <output aria-label="Form validity">{isValid ? "valid" : "invalid"}</output>
  )
}

const renderOptimizeForm = (inspection: FileInspection) =>
  render(
    <BookOptimizeProvider
      book={book}
      link={link}
      canUploadToDataSource={false}
      inspection={inspection}
    >
      <FormValidity />
      <MetadataForm />
    </BookOptimizeProvider>,
  )

const identifierRows = (): HTMLElement[] =>
  screen.getAllByRole("group", { name: "Identifier" })

describe("BookOptimizeProvider", function testBookOptimizeProvider() {
  afterEach(function cleanUpBookOptimizeProvider() {
    cleanup()
  })

  it("shows why an identifier the book carries keeps the form invalid", async function showSeededIdentifierError() {
    renderOptimizeForm(
      await inspect({
        "META-INF/container.xml": CONTAINER_XML,
        "OEBPS/content.opf": opf(
          '<dc:identifier id="pub-id">urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6</dc:identifier>' +
            '<dc:identifier opf:scheme="ISBN">978-0</dc:identifier>',
        ),
      }),
    )

    expect(
      await screen.findByText("Not a recognizable ISBN-10 or ISBN-13"),
    ).not.toBeNull()
    expect(screen.getByLabelText("Form validity").textContent).toBe("invalid")
  })

  it("opens a book whose identifiers are valid with no error", async function openValidIdentifiers() {
    renderOptimizeForm(
      await inspect({
        "META-INF/container.xml": CONTAINER_XML,
        "OEBPS/content.opf": opf(
          '<dc:identifier id="pub-id">urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6</dc:identifier>' +
            '<dc:identifier opf:scheme="ISBN">9783161484100</dc:identifier>',
        ),
      }),
    )

    expect(await screen.findByDisplayValue("9783161484100")).not.toBeNull()
    await waitFor(function expectFormValid() {
      expect(screen.getByLabelText("Form validity").textContent).toBe("valid")
    })

    for (const row of identifierRows()) {
      expect(within(row).queryByText(/^Not |^Required$/)).toBeNull()
    }
  })
})
