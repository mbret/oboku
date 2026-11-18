import { LaunchRounded } from "@mui/icons-material"
import { List } from "@mui/material"
import { cleanup, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it } from "vitest"
import { ListItemExternalLink } from "./ListItemExternalLink"
import { ListItemLink } from "./ListItemLink"

describe("link rows", () => {
  afterEach(() => {
    cleanup()
  })

  it("puts each link row in an item of its list, as screen readers count them", () => {
    render(
      <MemoryRouter>
        <List>
          <ListItemLink
            to="/integrations/webdav"
            icon={<LaunchRounded />}
            primary="WebDAV"
          />
          <ListItemExternalLink
            href="https://docs.oboku.me"
            icon={<LaunchRounded />}
            primary="Documentation Page"
          />
        </List>
      </MemoryRouter>,
    )

    const items = within(screen.getByRole("list")).getAllByRole("listitem")

    expect(
      items.map((item) => within(item).getByRole("link").textContent),
    ).toEqual(["WebDAV", "Documentation Page"])
  })

  it("opens an external link row in a new tab", () => {
    render(
      <List>
        <ListItemExternalLink
          href="https://docs.oboku.me"
          icon={<LaunchRounded />}
          primary="Documentation Page"
        />
      </List>,
    )

    const link = screen.getByRole<HTMLAnchorElement>("link")

    expect(link.getAttribute("href")).toBe("https://docs.oboku.me")
    expect(link.getAttribute("target")).toBe("_blank")
  })
})
