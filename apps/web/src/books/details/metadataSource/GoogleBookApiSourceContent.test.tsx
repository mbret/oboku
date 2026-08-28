// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { GoogleBookApiSourceContent } from "./GoogleBookApiSourceContent"

const COVER_URL =
  "https://books.google.com/books/publisher/content?id=Ebb6DQAAQBAJ&printsec=frontcover&img=1&zoom=0&source=gbs_api"

afterEach(cleanup)

describe("GoogleBookApiSourceContent, the cover link it renders", () => {
  it("opens the cover in a new tab without leaking the referrer", () => {
    render(
      <GoogleBookApiSourceContent
        metadata={{ type: "googleBookApi", coverLink: COVER_URL }}
      />,
    )

    const link = screen.getByRole("link")

    expect(link.getAttribute("href")).toBe(COVER_URL)
    expect(link.getAttribute("target")).toBe("_blank")
    expect(link.getAttribute("rel")).toContain("noopener")
  })

  it("keeps the whole url reachable on hover", () => {
    render(
      <GoogleBookApiSourceContent
        metadata={{ type: "googleBookApi", coverLink: COVER_URL }}
      />,
    )

    expect(screen.getByRole("link").getAttribute("title")).toBe(COVER_URL)
  })

  it("renders no link when the volume advertises no cover", () => {
    render(
      <GoogleBookApiSourceContent
        metadata={{ type: "googleBookApi", title: "BLAME! Vol 1" }}
      />,
    )

    expect(screen.queryByRole("link")).toBeNull()
  })
})
