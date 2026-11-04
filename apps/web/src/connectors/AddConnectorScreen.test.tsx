import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "vitest/browser"
import { MemoryRouter, Route, Routes } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock(
  "../integrations/synology-drive/synologyDrivePlugin/connectors/ConnectorForm",
  () => ({
    ConnectorForm: function FakeSynologyConnectorForm({
      onSubmitSuccess,
    }: {
      onSubmitSuccess: () => void
    }) {
      return (
        <button type="button" onClick={onSubmitSuccess}>
          Save connector
        </button>
      )
    },
  }),
)

import { ROUTES } from "../navigation/routes"
import { AddConnectorScreen } from "./AddConnectorScreen"

function renderAddConnectorScreen(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={ROUTES.INTEGRATION_CONNECTORS_NEW}
          element={<AddConnectorScreen />}
        />
        <Route
          path={ROUTES.INTEGRATION_SYNOLOGY_DRIVE}
          element={<div>Synology Drive page</div>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AddConnectorScreen", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the form of the connector's plugin and returns to its integration page once saved", async () => {
    renderAddConnectorScreen("/integrations/synology-drive/connectors/new")

    expect(screen.getByText("Synology: New connector")).toBeDefined()

    await userEvent.click(
      screen.getByRole("button", { name: "Save connector" }),
    )

    expect(screen.getByText("Synology Drive page")).toBeDefined()
  })

  it("renders nothing for a plugin without connectors", () => {
    renderAddConnectorScreen("/integrations/dropbox/connectors/new")

    expect(screen.queryByText(/New connector/)).toBeNull()
  })
})
