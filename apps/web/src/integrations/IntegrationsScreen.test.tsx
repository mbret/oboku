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

  it("lists the integrations, not the plugins that belong to none", () => {
    renderIntegrationsScreen(EVERY_PROVIDER_CONFIGURED)

    const integrationNames = [
      "Dropbox",
      "Google",
      "KOReader",
      "OneDrive",
      "Server",
      "Synology Drive",
      "WebDAV",
    ]

    expect(screen.getAllByRole("link")).toHaveLength(integrationNames.length)

    for (const name of integrationNames) {
      expect(getIntegrationLink(name)).toBeDefined()
    }

    expect(queryIntegrationLink("File")).toBeNull()
    expect(queryIntegrationLink("Uri")).toBeNull()
  })

  it("links each integration to its page", () => {
    renderIntegrationsScreen(EVERY_PROVIDER_CONFIGURED)

    expect(getIntegrationLink("KOReader").getAttribute("href")).toBe(
      "/integrations/koreader",
    )
    expect(getIntegrationLink("Google").getAttribute("href")).toBe(
      "/integrations/google",
    )
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
