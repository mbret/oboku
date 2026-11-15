import { i18n } from "@lingui/core"
import { I18nProvider } from "@lingui/react"
import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { activateLocale } from "../../i18n/activateLocale"
import { localSettingsSignal } from "../../settings/useLocalSettings"
import { SettingsList } from "./SettingsList"

describe("SettingsList", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the active locale's text and follows a locale change", async () => {
    localSettingsSignal.update((settings) => ({
      ...settings,
      readingFullScreenSwitchMode: "always",
    }))
    await activateLocale("en")

    render(
      <I18nProvider i18n={i18n}>
        <SettingsList />
      </I18nProvider>,
    )

    expect(screen.getByText("Reading")).toBeTruthy()
    expect(screen.getByText("Keep screen on")).toBeTruthy()
    expect(screen.getByText("Always")).toBeTruthy()
    expect(document.documentElement.lang).toBe("en")

    await act(() => activateLocale("fr"))

    expect(screen.getByText("Lecture")).toBeTruthy()
    expect(screen.getByText("Garder l'écran allumé")).toBeTruthy()
    expect(screen.getByText("Toujours")).toBeTruthy()
    expect(document.documentElement.lang).toBe("fr")
  })
})
