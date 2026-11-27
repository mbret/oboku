import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { FileProviderContent } from "./FileProviderContent"

function getRowWithText(text: string) {
  const row = screen.getByText(text).closest("li")

  if (!row) throw new Error(`No row shows ${text}`)

  return within(row)
}

afterEach(cleanup)

describe("FileProviderContent, the identifiers of the file", () => {
  it("shows one row per identifier, labelled with its scheme", () => {
    render(
      <FileProviderContent
        entry={{
          type: "file",
          version: 5,
          metadata: {
            identifiers: [
              { scheme: "ISBN", value: "9780765311788", unique: true },
              { scheme: "GTIN", value: "9780765311788" },
              { scheme: "DOI", value: "10.1000/182" },
              { scheme: "calibre", value: "3b7cbe2b-calibre" },
            ],
          },
        }}
      />,
    )

    expect(screen.getAllByText("9780765311788")).toHaveLength(2)
    expect(getRowWithText("ISBN").getByText("9780765311788")).toBeTruthy()
    expect(
      getRowWithText("GTIN / barcode").getByText("9780765311788"),
    ).toBeTruthy()
    expect(getRowWithText("10.1000/182").getByText("DOI")).toBeTruthy()
    expect(getRowWithText("3b7cbe2b-calibre").getByText("calibre")).toBeTruthy()
  })

  it("shows the ISBN and the Google Books id of an entry stored before it kept every identifier", () => {
    render(
      <FileProviderContent
        entry={{
          type: "file",
          isbn: "9780765311788",
          googleVolumeId: "zyTCAlFPjgYC",
        }}
      />,
    )

    expect(getRowWithText("9780765311788").getByText("ISBN")).toBeTruthy()
    expect(
      getRowWithText("zyTCAlFPjgYC").getByText("Google Books id"),
    ).toBeTruthy()
  })
})
