import { links } from "@oboku/shared"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { WebdavRequirementsAlert } from "./WebdavRequirementsAlert"

describe("WebdavRequirementsAlert", () => {
  it("opens the connector docs in a new tab, so the form keeps what the user typed", () => {
    render(<WebdavRequirementsAlert />)

    const readThis = screen.getByRole("link", { name: "read this" })

    expect(readThis.getAttribute("href")).toBe(links.documentationConnectors)
    expect(readThis.getAttribute("target")).toBe("_blank")
  })
})
