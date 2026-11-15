import { i18n } from "@lingui/core"
import { I18nProvider } from "@lingui/react"
import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { activateLocale } from "../i18n/activateLocale"
import { ReadingSettings } from "./ReadingSettings"

describe("ReadingSettings", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the active locale's text and follows a locale change", async () => {
    await activateLocale("en")

    render(
      <I18nProvider i18n={i18n}>
        <ReadingSettings />
      </I18nProvider>,
    )

    expect(screen.getByText("Keep screen on")).toBeTruthy()
    expect(screen.getByText("Never")).toBeTruthy()

    await act(() => activateLocale("fr"))

    expect(screen.getByText("Garder l'écran allumé")).toBeTruthy()
    expect(screen.getByText("Jamais")).toBeTruthy()
  })
})
