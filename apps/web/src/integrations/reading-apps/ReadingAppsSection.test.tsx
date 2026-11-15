import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ROUTES } from "../../navigation/routes"

const mocks = vi.hoisted(function createReadingAppsSectionMocks() {
  return {
    useKoreaderSyncServer: vi.fn(),
    useKoreaderSyncConnection: vi.fn(),
  }
})

vi.mock(
  "../koreader/server/useKoreaderSyncServer",
  async function mockKoreaderSyncServer(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../koreader/server/useKoreaderSyncServer")
      >()),
      useKoreaderSyncServer: mocks.useKoreaderSyncServer,
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
      useKoreaderSyncConnection: mocks.useKoreaderSyncConnection,
    }
  },
)

import { ReadingAppsSection } from "./ReadingAppsSection"

const KOREADER_SYNC_SERVER_PURPOSE =
  "Let KOReader, Readest, CrossPoint… sync their reading position through oboku"
const KOREADER_PROGRESS_SYNC_PURPOSE =
  "Sync oboku's reading position through a KOReader sync server"

function renderReadingAppsSection() {
  render(
    <MemoryRouter>
      <ReadingAppsSection />
    </MemoryRouter>,
  )
}

function getLinkText(name: string) {
  return screen.getByRole("link", { name: new RegExp(`^${name}`) }).textContent
}

describe("ReadingAppsSection", () => {
  beforeEach(() => {
    mocks.useKoreaderSyncServer.mockReturnValue({ data: undefined })
    mocks.useKoreaderSyncConnection.mockReturnValue({ data: undefined })
  })

  afterEach(() => {
    cleanup()
  })

  it("links to the OPDS servers, the KOReader sync server and KOReader progress sync", () => {
    renderReadingAppsSection()

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
  })

  it.each([
    ["is loading", undefined, KOREADER_SYNC_SERVER_PURPOSE],
    [
      "is off",
      { username: "reader@example.com", passwordCreatedAt: null },
      `Off · ${KOREADER_SYNC_SERVER_PURPOSE}`,
    ],
    [
      "is on",
      {
        username: "reader@example.com",
        passwordCreatedAt: "2026-10-01T08:00:00.000Z",
      },
      "On",
    ],
  ])(
    "describes the KOReader sync server when it %s",
    (_state, data, description) => {
      mocks.useKoreaderSyncServer.mockReturnValue({ data })

      renderReadingAppsSection()

      expect(getLinkText("KOReader sync server")).toBe(
        `KOReader sync server${description}`,
      )
    },
  )

  it.each([
    ["is loading", undefined, KOREADER_PROGRESS_SYNC_PURPOSE],
    ["is off", { connection: null }, KOREADER_PROGRESS_SYNC_PURPOSE],
    [
      "is on",
      {
        connection: {
          serverUrl: "https://sync.example.com",
          username: "reader",
          connectedAt: "2026-10-01T08:00:00.000Z",
        },
      },
      "Syncing with https://sync.example.com",
    ],
  ])(
    "describes KOReader progress sync when it %s",
    (_state, data, description) => {
      mocks.useKoreaderSyncConnection.mockReturnValue({ data })

      renderReadingAppsSection()

      expect(getLinkText("KOReader progress sync")).toBe(
        `KOReader progress sync${description}`,
      )
    },
  )
})
