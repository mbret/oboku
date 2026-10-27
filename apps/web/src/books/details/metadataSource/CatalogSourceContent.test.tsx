import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { CatalogSourceContent } from "./CatalogSourceContent"

const COVER_URL =
  "https://books.google.com/books/publisher/content?id=Ebb6DQAAQBAJ&printsec=frontcover&img=1&zoom=0&source=gbs_api"

afterEach(cleanup)

describe("CatalogSourceContent, the cover link it renders", () => {
  it("opens the cover in a new tab without leaking the referrer", () => {
    render(
      <CatalogSourceContent
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
      <CatalogSourceContent
        entry={{ type: "googleBookApi", coverLink: COVER_URL }}
      />,
    )

    const link = screen.getByRole("link")

    expect(link.textContent).toBe("Open image")
    expect(link.getAttribute("title")).toBe(COVER_URL)
  })

  it("renders no link when the volume advertises no cover", () => {
    render(
      <CatalogSourceContent
        entry={{ type: "googleBookApi", title: "BLAME! Vol 1" }}
      />,
    )

    expect(screen.queryByRole("link")).toBeNull()
  })
})

describe("CatalogSourceContent, for a catalog match", () => {
  it("names the catalog and shows the record's fields", () => {
    render(
      <CatalogSourceContent
        entry={{
          type: "catalog",
          version: 1,
          providerId: "openLibrary",
          score: 1,
          accepted: true,
          signals: [],
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

  it("names Google Books for an entry stored before catalog matches", () => {
    render(
      <CatalogSourceContent
        entry={{ type: "googleBookApi", title: "BLAME! Vol 1" }}
      />,
    )

    expect(screen.getByText("Google Books")).toBeTruthy()
  })
})
