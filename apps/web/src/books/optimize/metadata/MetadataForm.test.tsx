import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useForm } from "react-hook-form"
import {
  EMPTY_BOOK_OPTIMIZE_FORM_VALUES,
  type BookOptimizeFormValues,
} from "../form"
import { MetadataForm } from "./MetadataForm"
import type { MetadataIdentifierFormValue } from "./formValues"

const mocks = vi.hoisted(function createMocks() {
  return {
    useBookOptimize: vi.fn(),
    useIsApplyingLocally: vi.fn(function isNotApplyingLocally() {
      return false
    }),
  }
})

vi.mock("../BookOptimizeProvider", function mockBookOptimizeProvider() {
  return { useBookOptimize: mocks.useBookOptimize }
})

vi.mock("../apply/useApplyLocally", function mockUseApplyLocally() {
  return { useIsApplyingLocally: mocks.useIsApplyingLocally }
})

function MetadataFormHarness({
  identifiers,
}: {
  identifiers: MetadataIdentifierFormValue[]
}) {
  const { control } = useForm<BookOptimizeFormValues>({
    defaultValues: { ...EMPTY_BOOK_OPTIMIZE_FORM_VALUES, identifiers },
    mode: "onChange",
  })

  mocks.useBookOptimize.mockReturnValue({
    bookId: "book-id",
    control,
    isUploading: false,
    inspection: {
      resolvedArchive: { sources: { opf: {} }, unreadableSources: [] },
    },
  })

  return <MetadataForm />
}

const identifierRows = (): HTMLElement[] =>
  screen.queryAllByRole("group", { name: "Identifier" })

const identifierRow = (index: number): HTMLElement => {
  const row = identifierRows()[index]

  if (!row) throw new Error(`Expected an identifier row at index ${index}`)

  return row
}

const openSchemePicker = (index: number) => {
  fireEvent.mouseDown(within(identifierRow(index)).getByRole("combobox"))
}

const removeIdentifierButton = (index: number): HTMLElement =>
  within(identifierRow(index)).getByLabelText("Remove identifier")

describe("MetadataForm", function testMetadataForm() {
  afterEach(function cleanUpMetadataForm() {
    cleanup()
    vi.clearAllMocks()
  })

  it("seeds one row per identifier the book carries", function seedIdentifiers() {
    render(
      <MetadataFormHarness
        identifiers={[
          { scheme: "ISBN", value: "9783161484100", unique: false },
          { scheme: "GoogleBooks", value: "zyTCAlFPjgYC", unique: false },
        ]}
      />,
    )

    expect(screen.getByDisplayValue("9783161484100")).not.toBeNull()
    expect(screen.getByDisplayValue("zyTCAlFPjgYC")).not.toBeNull()
    expect(screen.getByText("ISBN")).not.toBeNull()
    expect(screen.getByText("Google Books id")).not.toBeNull()
  })

  it("appends an empty ISBN row on demand", function appendIdentifier() {
    render(<MetadataFormHarness identifiers={[]} />)

    expect(identifierRows()).toHaveLength(0)

    fireEvent.click(screen.getByRole("button", { name: "Add identifier" }))

    expect(identifierRows()).toHaveLength(1)
    expect(screen.getByText("ISBN")).not.toBeNull()
  })

  it("lets a row switch to the Google Books scheme", function pickGoogleBooksScheme() {
    render(
      <MetadataFormHarness
        identifiers={[{ scheme: "ISBN", value: "", unique: false }]}
      />,
    )

    openSchemePicker(0)
    fireEvent.click(screen.getByRole("option", { name: "Google Books id" }))

    expect(screen.getByPlaceholderText("zyTCAlFPjgYC")).not.toBeNull()
  })

  it("reveals a free-text scheme field for a custom scheme", function typeCustomScheme() {
    render(
      <MetadataFormHarness
        identifiers={[{ scheme: "ISBN", value: "", unique: false }]}
      />,
    )

    openSchemePicker(0)
    fireEvent.click(screen.getByRole("option", { name: "Custom…" }))

    const schemeField = screen.getByLabelText("Custom scheme")

    fireEvent.change(schemeField, { target: { value: "AcmeCatalog" } })

    expect(schemeField).toHaveProperty("value", "AcmeCatalog")
  })

  it("shows an identifier read from the file under a custom scheme as custom", function seedCustomScheme() {
    render(
      <MetadataFormHarness
        identifiers={[
          { scheme: "AcmeCatalog", value: "acme-42", unique: false },
        ]}
      />,
    )

    expect(screen.getByLabelText("Custom scheme")).toHaveProperty(
      "value",
      "AcmeCatalog",
    )
  })

  it("removes the row it is asked to remove", function removeIdentifier() {
    render(
      <MetadataFormHarness
        identifiers={[
          { scheme: "ISBN", value: "9783161484100", unique: false },
          { scheme: "GoogleBooks", value: "zyTCAlFPjgYC", unique: false },
        ]}
      />,
    )

    fireEvent.click(removeIdentifierButton(0))

    expect(screen.queryByDisplayValue("9783161484100")).toBeNull()
    expect(screen.getByDisplayValue("zyTCAlFPjgYC")).not.toBeNull()
  })

  it("keeps the book's unique identifier from being removed", function protectUniqueIdentifier() {
    render(
      <MetadataFormHarness
        identifiers={[
          { scheme: "ISBN", value: "9783161484100", unique: true },
          { scheme: "GoogleBooks", value: "zyTCAlFPjgYC", unique: false },
        ]}
      />,
    )

    expect(removeIdentifierButton(0)).toHaveProperty("disabled", true)
    expect(removeIdentifierButton(1)).toHaveProperty("disabled", false)
  })

  it("rejects a value that is not a valid ISBN", async function rejectInvalidIsbn() {
    render(
      <MetadataFormHarness
        identifiers={[{ scheme: "ISBN", value: "", unique: false }]}
      />,
    )

    fireEvent.change(screen.getByLabelText("Value"), {
      target: { value: "not-an-isbn" },
    })

    expect(
      await screen.findByText("Not a recognizable ISBN-10 or ISBN-13"),
    ).not.toBeNull()
  })

  it("accepts any value once the scheme is Google Books", async function acceptGoogleVolumeId() {
    render(
      <MetadataFormHarness
        identifiers={[{ scheme: "GoogleBooks", value: "", unique: false }]}
      />,
    )

    fireEvent.change(screen.getByLabelText("Value"), {
      target: { value: "zyTCAlFPjgYC" },
    })

    expect(
      screen.queryByText("Not a recognizable ISBN-10 or ISBN-13"),
    ).toBeNull()
  })

  it("shows an identifier the reader reads as a UUID under its scheme", function seedUuidScheme() {
    render(
      <MetadataFormHarness
        identifiers={[
          {
            scheme: "UUID",
            value: "urn:uuid:A1B0D67E-2E81-4DF5-9E67-A64CBE366809",
            unique: true,
          },
        ]}
      />,
    )

    expect(screen.getByText("UUID")).not.toBeNull()
    expect(screen.queryByLabelText("Custom scheme")).toBeNull()
  })

  it("rejects a value that is not a UUID", async function rejectInvalidUuid() {
    render(
      <MetadataFormHarness
        identifiers={[{ scheme: "UUID", value: "", unique: false }]}
      />,
    )

    fireEvent.change(screen.getByLabelText("Value"), {
      target: { value: "urn:uuid:not-a-uuid" },
    })

    expect(
      await screen.findByText(
        "Not a UUID, e.g. urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
      ),
    ).not.toBeNull()
  })

  it("rejects a value that is not a URN", async function rejectInvalidUrn() {
    render(
      <MetadataFormHarness
        identifiers={[{ scheme: "URN", value: "", unique: false }]}
      />,
    )

    fireEvent.change(screen.getByLabelText("Value"), {
      target: { value: "nbn:de:101:1-2011" },
    })

    expect(
      await screen.findByText("Not a URN, e.g. urn:nbn:de:101:1-2011"),
    ).not.toBeNull()
  })
})
