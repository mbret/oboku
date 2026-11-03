import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ROUTES } from "../../navigation/routes"

const SYNC_SERVER_TURNED_ON_AT = "2026-10-01T08:00:00.000Z"

vi.mock(
  "./server/useKoreaderSyncServer",
  async function mockKoreaderSyncServer(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("./server/useKoreaderSyncServer")
      >()),
      useKoreaderSyncServer: function useKoreaderSyncServer() {
        return { data: { passwordCreatedAt: SYNC_SERVER_TURNED_ON_AT } }
      },
    }
  },
)

vi.mock(
  "./client/useKoreaderSyncConnection",
  async function mockKoreaderSyncConnection(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("./client/useKoreaderSyncConnection")
      >()),
      useKoreaderSyncConnection: function useKoreaderSyncConnection() {
        return {
          data: { connection: { serverUrl: "https://sync.example.com" } },
        }
      },
    }
  },
)

import { KoreaderIntegrationScreen } from "./KoreaderIntegrationScreen"

describe("KoreaderIntegrationScreen", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the KOReader sync server and progress sync with their status", () => {
    render(
      <MemoryRouter>
        <KoreaderIntegrationScreen />
      </MemoryRouter>,
    )

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
