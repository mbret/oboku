import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ROUTES } from "../../navigation/routes"

const SYNC_SERVER_TURNED_ON_AT = "2026-10-01T08:00:00.000Z"

vi.mock(
  "../koreader/server/useKoreaderSyncServer",
  async function mockKoreaderSyncServer(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../koreader/server/useKoreaderSyncServer")
      >()),
      useKoreaderSyncServer: function useKoreaderSyncServer() {
        return { data: { passwordCreatedAt: SYNC_SERVER_TURNED_ON_AT } }
      },
    }
  },
)

vi.mock(
  "../koreader/client/useKoreaderSyncConnection",
  async function mockKoreaderSyncConnection(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../koreader/client/useKoreaderSyncConnection")
      >()),
      useKoreaderSyncConnection: function useKoreaderSyncConnection() {
        return {
          data: { connection: { serverUrl: "https://sync.example.com" } },
        }
      },
    }
  },
)

import { ReadingAppsSection } from "./ReadingAppsSection"

describe("ReadingAppsSection", () => {
  afterEach(() => {
    cleanup()
  })

  it("links to the OPDS servers, the KOReader sync server and progress sync, with their status", () => {
    render(
      <MemoryRouter>
        <ReadingAppsSection />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole("link", { name: /^OPDS servers/ }).getAttribute("href"),
    ).toBe(ROUTES.OPDS_SERVERS)
    expect(
      screen
        .getByRole("link", { name: /^KOReader sync server/ })
        .getAttribute("href"),
    ).toBe(ROUTES.KOREADER_SYNC_SERVER)
    expect(
      screen
        .getByRole("link", { name: /^KOReader progress sync/ })
        .getAttribute("href"),
    ).toBe(ROUTES.KOREADER_PROGRESS_SYNC)
    expect(screen.getByText("On")).toBeDefined()
    expect(
      screen.getByText("Syncing with https://sync.example.com"),
    ).toBeDefined()
  })
})
