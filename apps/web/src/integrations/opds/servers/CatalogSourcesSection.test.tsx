import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CatalogSourcesSection } from "./CatalogSourcesSection"

const mocks = vi.hoisted(function createCatalogSourcesMocks() {
  return {
    config: {
      FEATURE_GOOGLE_CONNECTION_ENABLED: true,
      FEATURE_GOOGLE_DRIVE_ENABLED: true,
      FEATURE_DROPBOX_ENABLED: true,
      FEATURE_ONE_DRIVE_ENABLED: true,
      FEATURE_SERVER_SYNC_ENABLED: true,
      SHOW_DISABLED_PLUGINS: false,
    },
  }
})

vi.mock("../../../config/useConfig", function mockConfig() {
  return { useConfig: () => ({ data: mocks.config }) }
})

const renderSection = () => {
  render(
    <MemoryRouter>
      <CatalogSourcesSection />
    </MemoryRouter>,
  )
}

const sourceLinks = () =>
  screen
    .getAllByRole<HTMLAnchorElement>("link")
    .map((link) => [link.textContent, link.getAttribute("href")])

describe("CatalogSourcesSection", () => {
  beforeEach(() => {
    mocks.config.FEATURE_GOOGLE_CONNECTION_ENABLED = true
    mocks.config.FEATURE_GOOGLE_DRIVE_ENABLED = true
    mocks.config.FEATURE_DROPBOX_ENABLED = true
  })

  afterEach(() => {
    cleanup()
  })

  it("lists Google Drive and WebDAV, one row each, opening their own screen", () => {
    renderSection()

    expect(sourceLinks()).toEqual([
      ["Google Drive", "/integrations/google"],
      ["WebDAV", "/integrations/webdav"],
    ])
  })

  it("names Google Drive with the sources not available when the instance cannot connect a Google account", () => {
    mocks.config.FEATURE_GOOGLE_CONNECTION_ENABLED = false
    renderSection()

    expect(sourceLinks()).toEqual([["WebDAV", "/integrations/webdav"]])
    expect(screen.getByText(/Google Drive/).textContent).toBe(
      "Dropbox, Google Drive, Local file, OneDrive, OPDS catalog, Server files, Synology Drive, Web link",
    )
  })

  it("lists Google Drive while this instance can connect a Google account, though it hides the Drive plugin", () => {
    mocks.config.FEATURE_GOOGLE_DRIVE_ENABLED = false
    renderSection()

    expect(sourceLinks()).toEqual([
      ["Google Drive", "/integrations/google"],
      ["WebDAV", "/integrations/webdav"],
    ])
  })

  it("names every kind of source the catalogs cannot serve yet on one line", () => {
    renderSection()

    expect(screen.getByText("Not available yet")).toBeTruthy()
    expect(screen.getByText(/Dropbox/).textContent).toBe(
      "Dropbox, Local file, OneDrive, OPDS catalog, Server files, Synology Drive, Web link",
    )
  })

  it("leaves out the kinds of source this instance hides", () => {
    mocks.config.FEATURE_DROPBOX_ENABLED = false
    renderSection()

    expect(screen.getByText(/OneDrive/).textContent).toBe(
      "Local file, OneDrive, OPDS catalog, Server files, Synology Drive, Web link",
    )
  })
})
