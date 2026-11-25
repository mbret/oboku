import type { CatalogMetadata } from "@oboku/shared"
import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { CatalogProviderContent } from "./CatalogProviderContent"

function getRowWithText(text: string) {
  const row = screen.getByText(text).closest("li")

  if (!row) throw new Error(`No row shows ${text}`)

  return within(row)
}

const COVER_URL =
  "https://books.google.com/books/publisher/content?id=Ebb6DQAAQBAJ&printsec=frontcover&img=1&zoom=0&source=gbs_api"

const RECORD_URL = "https://openlibrary.org/works/OL15358691W"

const OPEN_LIBRARY_MATCH = {
  type: "catalog",
  version: 1,
  providerId: "openLibrary",
  score: 1,
  accepted: true,
  signals: [],
  metadata: { titles: [{ value: "Mistborn" }] },
} satisfies CatalogMetadata

afterEach(cleanup)

describe("CatalogProviderContent, the cover link it renders", () => {
  it("opens the cover in a new tab without leaking the referrer", () => {
    render(
      <CatalogProviderContent
        entry={{ type: "googleBookApi", coverLink: COVER_URL }}
      />,
    )

    const link = screen.getByRole("link")

    expect(link.getAttribute("href")).toBe(COVER_URL)
    expect(link.getAttribute("target")).toBe("_blank")
    expect(link.getAttribute("rel")).toContain("noopener")
  })

  it("keeps the url out of the label and reachable on hover", () => {
    render(
      <CatalogProviderContent
        entry={{ type: "googleBookApi", coverLink: COVER_URL }}
      />,
    )

    const link = screen.getByRole("link")

    expect(link.textContent).toBe("Open image")
    expect(link.getAttribute("title")).toBe(COVER_URL)
  })

  it("renders no link when the volume advertises no cover", () => {
    render(
      <CatalogProviderContent
        entry={{ type: "googleBookApi", title: "BLAME! Vol 1" }}
      />,
    )

    expect(screen.queryByRole("link")).toBeNull()
  })
})

describe("CatalogProviderContent, for a catalog match", () => {
  it("names the catalog and shows the record's fields", () => {
    render(
      <CatalogProviderContent
        entry={{
          ...OPEN_LIBRARY_MATCH,
          metadata: {
            titles: [{ value: "Mistborn" }],
            contributors: [{ name: "Brandon Sanderson", roles: ["author"] }],
            cover: { uri: COVER_URL, confidence: "derived" },
          },
        }}
      />,
    )

    expect(screen.getByText("Open Library")).toBeTruthy()
    expect(screen.getByText("Mistborn")).toBeTruthy()
    expect(screen.getByText("Brandon Sanderson")).toBeTruthy()
    expect(screen.getByRole("link").getAttribute("href")).toBe(COVER_URL)
  })

  it("links the catalog name to the matched record, in a new tab", () => {
    render(
      <CatalogProviderContent
        entry={{ ...OPEN_LIBRARY_MATCH, url: RECORD_URL }}
      />,
    )

    const link = screen.getByRole("link", { name: "Open Library" })

    expect(link.getAttribute("href")).toBe(RECORD_URL)
    expect(link.getAttribute("title")).toBe(RECORD_URL)
    expect(link.getAttribute("target")).toBe("_blank")
    expect(link.getAttribute("rel")).toContain("noopener")
  })

  it("names the catalog without a link when the match has no url", () => {
    render(<CatalogProviderContent entry={OPEN_LIBRARY_MATCH} />)

    expect(screen.getByText("Open Library")).toBeTruthy()
    expect(screen.queryByRole("link")).toBeNull()
  })

  it("names Google Books for an entry stored before catalog matches", () => {
    render(
      <CatalogProviderContent
        entry={{ type: "googleBookApi", title: "BLAME! Vol 1" }}
      />,
    )

    expect(screen.getByText("Google Books")).toBeTruthy()
    expect(screen.queryByRole("link")).toBeNull()
  })
})

describe("CatalogProviderContent, the identifiers of a catalog match", () => {
  it("shows one row per identifier, labelled with its scheme", () => {
    render(
      <CatalogProviderContent
        entry={{
          ...OPEN_LIBRARY_MATCH,
          metadata: {
            titles: [{ value: "Mistborn" }],
            identifiers: [
              { scheme: "ISBN", value: "0765311780" },
              { scheme: "ISBN", value: "9780765311788" },
              { scheme: "DOI", value: "10.1000/182" },
              { scheme: "OpenLibrary", value: "/books/OL7353617M" },
              { scheme: "AcmeCatalog", value: "acme-42" },
            ],
          },
        }}
      />,
    )

    expect(getRowWithText("0765311780").getByText("ISBN")).toBeTruthy()
    expect(getRowWithText("9780765311788").getByText("ISBN")).toBeTruthy()
    expect(getRowWithText("10.1000/182").getByText("DOI")).toBeTruthy()
    expect(
      getRowWithText("/books/OL7353617M").getByText("Open Library"),
    ).toBeTruthy()
    expect(getRowWithText("acme-42").getByText("AcmeCatalog")).toBeTruthy()
    expect(screen.queryByText("Identifiers")).toBeNull()
  })

  it("shows an empty identifiers row when the match states none", () => {
    render(<CatalogProviderContent entry={OPEN_LIBRARY_MATCH} />)

    expect(
      getRowWithText("Identifiers").getByLabelText("No value"),
    ).toBeTruthy()
  })
})
