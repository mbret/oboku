import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ROUTES } from "../navigation/routes"

vi.mock(
  "./koreader/server/useKoreaderSyncServer",
  async function mockKoreaderSyncServer(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("./koreader/server/useKoreaderSyncServer")
      >()),
      useKoreaderSyncServer: function useKoreaderSyncServer() {
        return {
          data: {
            username: "reader@example.com",
            passwordCreatedAt: "2026-10-01T08:00:00.000Z",
          },
        }
      },
    }
  },
)

vi.mock(
  "./koreader/client/useKoreaderSyncConnection",
  async function mockKoreaderSyncConnection(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("./koreader/client/useKoreaderSyncConnection")
      >()),
      useKoreaderSyncConnection: function useKoreaderSyncConnection() {
        return {
          data: {
            connection: {
              serverUrl: "https://sync.example.com",
              username: "reader@example.com",
              connectedAt: "2026-10-01T08:00:00.000Z",
            },
          },
        }
      },
    }
  },
)

import { IntegrationScreen } from "./IntegrationScreen"

function renderIntegrationScreenAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={ROUTES.INTEGRATIONS} element={<p>Integrations list</p>} />
        <Route
          path={ROUTES.INTEGRATION_DETAILS}
          element={<IntegrationScreen />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe("IntegrationScreen", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the KOReader sync server and progress sync with their status", () => {
    renderIntegrationScreenAt("/integrations/koreader")

    expect(screen.getByText("KOReader")).toBeDefined()
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

  it("sends an unknown integration back to the list", () => {
    renderIntegrationScreenAt("/integrations/unknown")

    expect(screen.getByText("Integrations list")).toBeDefined()
  })
})
