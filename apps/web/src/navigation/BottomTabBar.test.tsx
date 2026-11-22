import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"
import { BottomTabBar } from "./BottomTabBar"

vi.mock("../notifications/inbox/useUnreadNotificationsCount", () => ({
  useUnreadNotificationsCount: function useUnreadNotificationsCount() {
    return { unreadCount: 0 }
  },
}))
vi.mock("../common/OfflineIcon", () => ({
  OfflineIcon: function OfflineIcon() {
    return null
  },
}))

afterEach(cleanup)

describe("BottomTabBar", () => {
  it("names each tab link after its destination", () => {
    render(
      <MemoryRouter initialEntries={["/library/books"]}>
        <BottomTabBar>{null}</BottomTabBar>
      </MemoryRouter>,
    )

    const linkNames = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("aria-label"))

    expect(linkNames).toEqual([
      "Home",
      "Library",
      "Sync",
      "Integrations",
      "Profile",
    ])
    expect(screen.getByRole("link", { name: "Library" })).toHaveProperty(
      "pathname",
      "/library",
    )
  })
})
