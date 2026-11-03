import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createIntegrationsScreenMocks() {
  return { useConfig: vi.fn() }
})

vi.mock("../config/useConfig", async function mockConfig(importOriginal) {
  return {
    ...(await importOriginal<typeof import("../config/useConfig")>()),
    useConfig: mocks.useConfig,
  }
})

import { IntegrationsScreen } from "./IntegrationsScreen"

const EVERY_PROVIDER_CONFIGURED = {
  FEATURE_DROPBOX_ENABLED: true,
  FEATURE_GOOGLE_DRIVE_ENABLED: true,
  FEATURE_ONE_DRIVE_ENABLED: true,
  FEATURE_SERVER_SYNC_ENABLED: true,
  SHOW_DISABLED_PLUGINS: false,
}

const INTEGRATION_HREF_BY_NAME = {
  Dropbox: "/integrations/dropbox",
  Google: "/integrations/google",
  KOReader: "/integrations/koreader",
  OneDrive: "/integrations/one-drive",
  Server: "/integrations/server",
  "Synology Drive": "/integrations/synology-drive",
  WebDAV: "/integrations/webdav",
}

function renderIntegrationsScreen(config: Record<string, boolean>) {
  mocks.useConfig.mockReturnValue({ data: config })

  render(
    <MemoryRouter>
      <IntegrationsScreen />
    </MemoryRouter>,
  )
}

function getIntegrationLink(name: string) {
  return screen.getByRole("link", { name: new RegExp(`^${name}`) })
}

function queryIntegrationLink(name: string) {
  return screen.queryByRole("link", { name: new RegExp(`^${name}`) })
}

describe("IntegrationsScreen", () => {
  afterEach(() => {
    cleanup()
  })

  it("links each integration to its page, without the plugins that belong to none", () => {
    renderIntegrationsScreen(EVERY_PROVIDER_CONFIGURED)

    const integrationPages = Object.entries(INTEGRATION_HREF_BY_NAME)

    expect(screen.getAllByRole("link")).toHaveLength(integrationPages.length)

    for (const [name, href] of integrationPages) {
      expect(getIntegrationLink(name).getAttribute("href")).toBe(href)
    }
  })

  it("hides an integration whose provider the instance did not configure", () => {
    renderIntegrationsScreen({
      ...EVERY_PROVIDER_CONFIGURED,
      FEATURE_DROPBOX_ENABLED: false,
    })

    expect(queryIntegrationLink("Dropbox")).toBeNull()
    expect(getIntegrationLink("KOReader")).toBeDefined()
  })

  it("shows it disabled when the instance shows non-configured providers", () => {
    renderIntegrationsScreen({
      ...EVERY_PROVIDER_CONFIGURED,
      FEATURE_DROPBOX_ENABLED: false,
      SHOW_DISABLED_PLUGINS: true,
    })

    expect(getIntegrationLink("Dropbox").getAttribute("aria-disabled")).toBe(
      "true",
    )
    expect(getIntegrationLink("KOReader").getAttribute("aria-disabled")).toBe(
      null,
    )
  })
})
