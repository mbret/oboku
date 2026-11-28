import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ROUTES } from "../../navigation/routes"

const mocks = vi.hoisted(function createReadingAppsSectionMocks() {
  return {
    useKoreaderSyncServer: vi.fn(),
    useKoreaderSyncConnection: vi.fn(),
    useConfig: vi.fn(),
    useSettings: vi.fn(),
  }
})

vi.mock("../../config/useConfig", async function mockConfig(importOriginal) {
  return {
    ...(await importOriginal<typeof import("../../config/useConfig")>()),
    useConfig: mocks.useConfig,
  }
})

vi.mock("../../settings/useSettings", function mockSettings() {
  return { useSettings: mocks.useSettings }
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

import { i18n } from "@lingui/core"
import { I18nProvider } from "@lingui/react"
import { activateLocale } from "../../i18n/activateLocale"
import { ReadingAppsSection } from "./ReadingAppsSection"

const KOREADER_SYNC_SERVER_PURPOSE =
  "Let KOReader, Readest, CrossPoint… sync their reading position through oboku"
const KOREADER_PROGRESS_SYNC_PURPOSE =
  "Sync oboku's reading position through a KOReader sync server"

function renderReadingAppsSection() {
  render(
    <I18nProvider i18n={i18n}>
      <MemoryRouter>
        <ReadingAppsSection />
      </MemoryRouter>
    </I18nProvider>,
  )
}

function getLinkText(name: string) {
  return screen.getByRole("link", { name: new RegExp(`^${name}`) }).textContent
}

describe("ReadingAppsSection", () => {
  beforeEach(async () => {
    mocks.useKoreaderSyncServer.mockReturnValue({ data: undefined })
    mocks.useKoreaderSyncConnection.mockReturnValue({ data: undefined })
    mocks.useConfig.mockReturnValue({
      data: { FEATURE_SEND_TO_KINDLE_ENABLED: false },
    })
    mocks.useSettings.mockReturnValue({ data: { _id: "settings" } })
    await activateLocale("en")
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

  it("has no Send to Kindle link on an instance that cannot send emails", () => {
    renderReadingAppsSection()

    expect(screen.queryByRole("link", { name: /^Send to Kindle/ })).toBeNull()
  })

  it.each([
    [
      "no address is saved",
      undefined,
      "Email a book of your library to your Kindle",
    ],
    [
      "an address is saved",
      "reader@kindle.com",
      "Sending to reader@kindle.com",
    ],
  ])(
    "links to Send to Kindle when %s, on an instance that sends emails",
    (_state, kindleEmail, description) => {
      mocks.useConfig.mockReturnValue({
        data: { FEATURE_SEND_TO_KINDLE_ENABLED: true },
      })
      mocks.useSettings.mockReturnValue({
        data: { _id: "settings", kindleEmail },
      })

      renderReadingAppsSection()

      expect(
        screen
          .getByRole("link", { name: /^Send to Kindle/ })
          .getAttribute("href"),
      ).toBe(ROUTES.SEND_TO_KINDLE)
      expect(getLinkText("Send to Kindle")).toBe(`Send to Kindle${description}`)
    },
  )
})
